#!/usr/bin/env node
/**
 * generate-audio.mjs — pre-generate Welsh TTS audio files for Tirio
 *
 * Usage:
 *   node scripts/generate-audio.mjs azure    # Azure Neural Welsh voice (recommended)
 *   node scripts/generate-audio.mjs macos    # macOS Seren voice (needs Seren installed)
 *
 * Azure setup:
 *   1. portal.azure.com → Create resource → search "Speech" → Create
 *   2. Pricing tier: F0 (free — 5M chars/month)
 *   3. After creation: Keys and Endpoint → copy Key 1 and Region
 *   4. AZURE_SPEECH_KEY=xxx AZURE_SPEECH_REGION=uksouth npm run generate-audio:azure
 *
 * Output: public/audio/<path> matching the paths in content/teulu_content.json
 * Existing files are skipped (idempotent). Drop real recordings at the same paths to replace.
 */

import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const CONTENT_PATH = join(ROOT, 'content/teulu_content.json');
const PUBLIC_AUDIO = join(ROOT, 'public/audio');

const provider = process.argv[2] || 'azure';
const AZURE_KEY    = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

if (provider === 'azure' && (!AZURE_KEY || !AZURE_REGION)) {
  console.error('Error: set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in your environment');
  console.error('  Example: AZURE_SPEECH_KEY=abc123 AZURE_SPEECH_REGION=uksouth npm run generate-audio:azure');
  process.exit(1);
}

const content = JSON.parse(readFileSync(CONTENT_PATH, 'utf8'));

// ── Welsh letter names — what the TTS should say for each letter ──────────────
// Passing bare characters ("A", "Ch") to TTS produces English-style letter names.
// These are the actual Welsh names spoken when reciting the Welsh alphabet.
// Welsh alphabet letter names. Most follow the "e + consonant" pattern (ec, ef, el…).
// B uses short 'i' rather than long 'î' to avoid sounding like English "bee".
const WELSH_LETTER_NAMES = {
  letter_a:  'a',
  letter_b:  'b',    // short i — long î sounds too much like English "B"
  letter_c:  'ec',
  letter_ch: 'ch',
  letter_d:  'da',
  letter_dd: 'edd',
  letter_e:  'e',
  letter_f:  'ef',    // Welsh F = /v/, so ef = /ɛv/
  letter_ff: 'eff',
  letter_g:  'eg',
  letter_ng: 'eng',
  letter_h:  'aitch',
  letter_i:  'i',
  letter_j:  'ji',
  letter_l:  'el',
  letter_ll: 'ell',
  letter_m:  'em',
  letter_n:  'en',
  letter_o:  'o',
  letter_p:  'pî',
  letter_ph: 'ffî',
  letter_r:  'er',
  letter_rh: 'rhî',
  letter_s:  'es',
  letter_t:  'tî',
  letter_th: 'eth',
  letter_u:  'u',
  letter_w:  'w',
  letter_y:  'y',
};

// ── collect all { text, audioPath } pairs from the JSON ──────────────────────

function collect(items) {
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const text = WELSH_LETTER_NAMES[item.id] || item.welsh || item.welsh_assembled || item.letter;
    const path = item.audio;
    if (text && path) out.push({ text, path });

    // recurse into known sub-arrays
    for (const key of ['words', 'examples', 'blocks', 'layers']) {
      if (Array.isArray(item[key])) out.push(...collect(item[key]));
    }
    // topic layers: parent_reference
    if (item.layers?.parent_reference) out.push(...collect(item.layers.parent_reference));
  }
  return out;
}

// top-level arrays
const items = [
  ...(content.topics || []),
  ...(content.blocks || []),
];
const pairs = collect(items);

// deduplicate by path
const seen = new Set();
const unique = pairs.filter(({ path }) => {
  if (seen.has(path)) return false;
  seen.add(path);
  return true;
});

console.log(`Found ${unique.length} audio items in teulu_content.json`);

// ── generate each file ────────────────────────────────────────────────────────

let generated = 0;
let skipped = 0;
let failed = 0;

for (const { text, path } of unique) {
  // path in JSON: e.g. "alphabet/words/afal.mp3" — dest under public/audio/
  const dest = join(PUBLIC_AUDIO, path);

  // also check the .m4a variant for macos provider
  const m4aDest = dest.replace(/\.mp3$/, '.m4a');
  const existingDest = provider === 'macos' ? m4aDest : dest;

  if (existsSync(existingDest)) {
    skipped++;
    continue;
  }

  mkdirSync(dirname(existingDest), { recursive: true });

  try {
    if (provider === 'macos') {
      const safeText = text.replace(/"/g, '\\"');
      execSync(`say -v Seren "${safeText}" --file-format=mp4f -o "${m4aDest}"`, { stdio: 'pipe' });
      generated++;
      console.log(`  ✓ ${path.replace('.mp3', '.m4a')} — "${text}"`);
    } else if (provider === 'azure') {
      await generateAzure(text, dest);
      generated++;
      console.log(`  ✓ ${path} — "${text}"`);
    }
  } catch (err) {
    failed++;
    console.error(`  ✗ ${path} — ${err.message}`);
  }
}

console.log(`\nDone. Generated: ${generated}  Skipped: ${skipped}  Failed: ${failed}`);

// ── Azure Speech Service TTS (Welsh Neural voice) ────────────────────────────

async function generateAzure(text, dest) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="cy-GB">
  <voice name="cy-GB-AledNeural">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</voice>
</speak>`;

  const res = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'tirio-audio-gen',
      },
      body: ssml,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure TTS error ${res.status}: ${err}`);
  }

  const buf = await res.arrayBuffer();
  writeFileSync(dest, Buffer.from(buf));
}
