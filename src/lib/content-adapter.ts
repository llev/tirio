'use client';
/* ============================================================
   Content adapter — reads teulu_content.json and augments the
   existing D (alphabet) and DD (dinner) exports with new fields
   needed for richer practice and say-it-together games.

   Adds to D:  sayTogetherRefs, allWordsById
   Adds to DD: blocks, blockById, 6 new mealtime phrases
   Exports:    DINNER_SAY_IT_REFS, sayTogetherRefs, allWordsById,
               blocks, blockById
   ============================================================ */
import rawContent from '../../content/teulu_content.json';
import D from './data';
import DD from './data-dinner';

const raw = rawContent as any;

// ============================================================
// BLOCKS — 28 phrase building blocks from JSON
// ============================================================
export const blocks: Array<{
  id: string; welsh: string; english: string; type: string;
  audio?: string; pronunciation_hint: string; notes: string;
}> = (raw.blocks as any[]).map((b: any) => ({
  id: b.id as string,
  welsh: b.welsh as string,
  english: b.english as string,
  type: b.type as string,
  audio: b.audio ? `/audio/${b.audio as string}` : undefined,
  pronunciation_hint: (b.pronunciation_hint || '') as string,
  notes: (b.notes || '') as string,
}));

export const blockById: Record<string, typeof blocks[0]> =
  Object.fromEntries(blocks.map(b => [b.id, b]));

(DD as any).blocks = blocks;
(DD as any).blockById = blockById;

// ============================================================
// NEW PHRASES — 6 mealtime instructions not in data-dinner.ts
// Colors follow the same pattern as existing phrases in data-dinner.ts.
// ============================================================
const PHRASE_COLORS: Record<string, string> = {
  phrase_dwin_llwgu:              'coral',
  phrase_dwin_hoffi_pasta:        'orange',
  phrase_dwi_ddim_yn_hoffi_pys:   'teal',
  phrase_dwin_llawn:              'gold',
  phrase_ga_i_fwy_o_datws:        'indigo',
  phrase_gair_halen:              'coral',
  phrase_gair_llaeth_plis:        'teal',
  phrase_diolch:                  'indigo',
  phrase_maer_bwyd_bron_yn_barod: 'teal',
  phrase_maer_swper_yn_barod:     'teal',
  phrase_aros:                    'gold',
  phrase_dewch_iw_fwyta:          'orange',
  phrase_golcha_dy_ddwylo:        'coral',
  phrase_eistedda:                'indigo',
};

function resolvePhrase(rawPhrase: any) {
  return {
    id: rawPhrase.id as string,
    welsh: rawPhrase.welsh_assembled as string,
    english: rawPhrase.english as string,
    natural: rawPhrase.english_natural as string,
    pron: (rawPhrase.pronunciation_hint || '') as string,
    color: PHRASE_COLORS[rawPhrase.id as string] || 'coral',
    context: (rawPhrase.context || '') as string,
    notes: (rawPhrase.notes || '') as string,
    alt: (rawPhrase.alt || '') as string,
    audio: rawPhrase.audio ? `/audio/${rawPhrase.audio as string}` : undefined,
    blocks: (rawPhrase.blocks as string[]).map((bid: string) => {
      const b = blockById[bid];
      return b
        ? { id: bid, welsh: b.welsh, english: b.english }
        : { id: bid, welsh: bid, english: bid };
    }),
  };
}

const dinnerTopic = (raw.topics as any[]).find((t: any) => t.id === 'dinner');
const dinnerParentRef: any[] = dinnerTopic?.layers?.parent_reference ?? [];
const jsonPhrases = dinnerParentRef.filter((item: any) => item.type === 'phrase');

const existingPhraseIds = new Set((DD as any).phrases.map((p: any) => p.id as string));
const newPhrases = jsonPhrases
  .filter((p: any) => !existingPhraseIds.has(p.id as string))
  .map(resolvePhrase);

if (newPhrases.length > 0) {
  (DD as any).phrases = [...(DD as any).phrases, ...newPhrases];
  (DD as any).phraseById = Object.fromEntries(
    (DD as any).phrases.map((p: any) => [p.id as string, p])
  );
}

// ============================================================
// DINNER_SAY_IT_REFS — 10-phrase rotation pool for DinnerSay
// ============================================================
export const DINNER_SAY_IT_REFS: string[] = [
  'phrase_ga_i_fwy_o_datws',
  'phrase_diolch',
  'phrase_dwin_hoffi_pasta',
  'phrase_dwi_ddim_yn_hoffi_pys',
  'phrase_dwin_llawn',
  'phrase_dwin_llwgu',
  'phrase_dewch_iw_fwyta',
  'phrase_eistedda',
  'phrase_aros',
  'phrase_maer_swper_yn_barod',
];

// ============================================================
// SAY_TOGETHER_REFS — per-letter word pools from JSON
// ============================================================
const alphabetTopic = (raw.topics as any[]).find((t: any) => t.id === 'alphabet');
const jsonLetters: any[] = alphabetTopic?.layers?.parent_reference ?? [];

export const sayTogetherRefs: Record<string, string[]> = {};
for (const letter of jsonLetters) {
  if ((letter.say_together_refs as any[])?.length) {
    sayTogetherRefs[letter.id as string] = letter.say_together_refs as string[];
  }
}

// ============================================================
// ALL_WORDS_BY_ID — alphabet + dinner words for cross-topic lookup
// ============================================================
const allAlphabetWords = (D as any).letters.flatMap((l: any) => (l.words ?? []) as any[]);
const allDinnerWords = (DD as any).allWords as any[];

export const allWordsById: Record<string, any> = {};
for (const w of [...allAlphabetWords, ...allDinnerWords]) {
  if (w?.id) allWordsById[w.id] = w;
}

(D as any).sayTogetherRefs = sayTogetherRefs;
(D as any).allWordsById = allWordsById;

// ============================================================
// AUDIO_PATH_BY_ID — maps word/letter/phrase IDs to audio file paths
// ============================================================
export const audioPathById: Record<string, string> = {};

for (const letter of jsonLetters) {
  if (letter.id && letter.audio) audioPathById[letter.id as string] = `/audio/${letter.audio as string}`;
  for (const word of (letter.words ?? []) as any[]) {
    if (word.id && word.audio) audioPathById[word.id as string] = `/audio/${word.audio as string}`;
  }
}

for (const item of dinnerParentRef) {
  if (item.id && item.audio) audioPathById[item.id as string] = `/audio/${item.audio as string}`;
}

for (const block of blocks) {
  if (block.id && block.audio) audioPathById[block.id] = block.audio;
}
