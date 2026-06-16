'use client';
/* ============================================================
   Tirio — shared primitives
   ============================================================ */
import { useState, useEffect, useRef, useCallback } from 'react';

/* ---------- Icons (stroke, currentColor) ---------- */
const PATHS = {
  back:    'M15 18l-6-6 6-6',
  fwd:     'M9 6l6 6-6 6',
  close:   'M6 6l12 12M18 6L6 18',
  check:   'M5 13l4 4L19 7',
  play:    'M8 5v14l11-7z',
  sound:   'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  mic:     'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v4',
  refresh: 'M3 12a9 9 0 1 0 3-6.7M3 3v4h4',
  spark:   'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
  bell:    'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  heart:   'M12 21s-7.5-4.6-10-9.5C.5 8 2.3 4.5 6 4.5c2.2 0 3.5 1.3 4 2.2.5-.9 1.8-2.2 4-2.2 3.7 0 5.5 3.5 4 7C19.5 16.4 12 21 12 21z',
};
export function Icon({ name, size = 22, sw = 2, fill = false, style }) {
  const filled = name === 'play';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ---------- Welsh TTS / audio file helper ---------- */
// Tries audio file first (if path supplied), then Welsh TTS, then silence.
// No English fallback — silence is better than English mispronouncing Welsh words.
export function speakText(text: string, audioPath?: string) {
  if (typeof window === 'undefined') return;

  if (audioPath) {
    const audio = new Audio(audioPath);
    audio.onerror = () => tryTTS();
    audio.play().catch(() => tryTTS());
    return;
  }
  tryTTS();

  function tryTTS() {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    function doSpeak() {
      const cyVoice = synth.getVoices().find(v => v.lang.startsWith('cy'));
      if (!cyVoice) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = cyVoice;
      u.lang = cyVoice.lang;
      synth.speak(u);
    }
    if (synth.getVoices().length > 0) {
      doSpeak();
    } else {
      synth.addEventListener('voiceschanged', function onVoices() {
        synth.removeEventListener('voiceschanged', onVoices);
        doSpeak();
      });
    }
  }
}

/* ---------- Audio simulation + Web Speech fallback ---------- */
// play(id)                    — visual pulse only (no text)
// play(id, welshText)         — speaks Welsh text via speakText() + visual pulse
// play(id, welshText, path)   — tries audio file first, then TTS
// play(id, ms)                — visual pulse with custom duration (existing usage unchanged)
export function useSimAudio() {
  const [playingId, setPlayingId] = useState(null);
  const tid = useRef(null);
  const play = useCallback((id, textOrMs?, audioPath?) => {
    clearTimeout(tid.current);
    if (typeof textOrMs === 'string') {
      speakText(textOrMs, audioPath);
      setPlayingId(id);
      tid.current = setTimeout(() => setPlayingId(null), 1800);
    } else {
      setPlayingId(id);
      tid.current = setTimeout(() => setPlayingId(null), typeof textOrMs === 'number' ? textOrMs : 1200);
    }
  }, []);
  useEffect(() => () => {
    clearTimeout(tid.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);
  return [playingId, play];
}

/* ---------- Real microphone recorder ---------- */
// Records from the mic via MediaRecorder; playback replays the captured blob.
export function useAudioRecorder() {
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState(false);
  const mrRef = useRef(null);
  const chunks = useRef([]);
  const blobUrl = useRef(null);
  const streamRef = useRef(null);
  const audioEl = useRef(null);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) { setMicError(true); return false; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = URL.createObjectURL(blob);
        setHasRecording(true);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mr.start();
      mrRef.current = mr;
      setMicError(false);
      setHasRecording(false);
      return true;
    } catch {
      setMicError(true);
      return false;
    }
  }

  function stop() {
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop();
  }

  // playOnce: plays the recording once and calls onEnd when done.
  function playOnce(onEnd?) {
    if (!blobUrl.current) return;
    if (audioEl.current) { audioEl.current.pause(); audioEl.current.onended = null; }
    const a = new Audio(blobUrl.current);
    audioEl.current = a;
    setIsPlaying(true);
    a.play().catch(() => { setIsPlaying(false); onEnd?.(); });
    a.onended = () => { setIsPlaying(false); onEnd?.(); audioEl.current = null; };
  }

  // replay: plays the recording again (from the celebration screen).
  function replay() {
    if (!blobUrl.current || isPlaying) return;
    playOnce();
  }

  function reset() {
    if (audioEl.current) { audioEl.current.pause(); audioEl.current.onended = null; audioEl.current = null; }
    if (blobUrl.current) { URL.revokeObjectURL(blobUrl.current); blobUrl.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (mrRef.current && mrRef.current.state !== 'inactive') { try { mrRef.current.stop(); } catch {} }
    mrRef.current = null;
    chunks.current = [];
    setHasRecording(false);
    setIsPlaying(false);
    setMicError(false);
  }

  useEffect(() => () => {
    if (audioEl.current) audioEl.current.pause();
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  return { start, stop, playOnce, replay, isPlaying, hasRecording, reset, micError };
}

/* ---------- Button (DS tr-btn) ---------- */
export function Button({ kind = 'primary', size, block, arrow, children, onClick, disabled, style, type = 'button' }) {
  const cls = ['tr-btn', `tr-btn--${kind}`, size === 'lg' && 'tr-btn--lg', block && 'tr-btn--block'].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style}>
      {children}{arrow && <span className="tr-btn__arrow">→</span>}
    </button>
  );
}

/* ---------- Audio button (DS tr-audio) ---------- */
export function AudioButton({ id, label, ghost, size = 48, play, playingId, onPlay, text, audioPath }) {
  const playing = playingId === id;
  return (
    <button className={`tr-audio${ghost ? ' tr-audio--ghost' : ''}${playing ? ' is-playing' : ''}`}
      style={{ width: size, height: size }} aria-label={label || 'Play audio'}
      onClick={(e) => { e.stopPropagation(); play(id, text, audioPath); onPlay && onPlay(); }}>
      <Icon name={playing ? 'sound' : 'play'} size={size * 0.42} />
    </button>
  );
}

/* ---------- Striped illustration placeholder (DS tr-art-slot) ---------- */
export function ArtSlot({ label, style }) {
  return (
    <div className="tr-art-slot" style={style}>
      <span>{(label || 'illustration').toUpperCase()}<br />{'·  ·  ·'}</span>
    </div>
  );
}

/* ---------- Letter tile (DS tr-tile) ---------- */
export function Tile({ letter, color = 'orange', layers = 0, sneaky, mini, onClick, ariaLabel }) {
  const digraph = letter.length > 1;
  return (
    <button
      className={`tr-tile tr-tile--c-${color}${mini ? ' tr-tile--mini' : ''}${sneaky ? ' tr-tile--sneaky' : ''}${digraph ? ' tr-tile--digraph' : ''}`}
      onClick={onClick} aria-label={ariaLabel || `Letter ${letter}`}>
      <span className="tr-tile__letter">{letter}</span>
      {!mini && layers > 0 && (
        <span className="tr-tile__dots">
          {[0, 1, 2, 3].map(i => <i key={i} className={i < layers ? 'on' : ''} />)}
        </span>
      )}
    </button>
  );
}

/* ---------- Engagement dots (standalone) ---------- */
export function EngDots({ n = 0, total = 4 }) {
  return (
    <span className="eng-dots">
      {Array.from({ length: total }).map((_, i) => <i key={i} className={i < n ? 'on' : ''} />)}
    </span>
  );
}

/* ---------- Word card (DS tr-wordcard) ---------- */
export function WordCard({ word, play, playingId, onPlay, highlightChars }) {
  // optional highlight (sneaky sounds) — renders welsh with highlighted indices
  const welsh = highlightChars
    ? <Welsh text={word.welsh} chars={highlightChars} />
    : word.welsh;
  return (
    <div className="tr-wordcard">
      <div className="tr-wordcard__art">
        <ArtSlot label={word.alt || word.english} />
      </div>
      <div className="tr-wordcard__welsh">{welsh}</div>
      <div className="tr-wordcard__en">{word.english}</div>
      <div className="tr-wordcard__row">
        <span className="tr-wordcard__pron">{word.pron}</span>
        <AudioButton id={`w-${word.id || word.welsh}`} size={44} ghost label={`Hear ${word.welsh}`}
          play={play} playingId={playingId} onPlay={onPlay} />
      </div>
    </div>
  );
}

/* ---------- Highlighted Welsh text (sneaky sounds) ---------- */
export function Welsh({ text, chars = [] }) {
  const set = new Set(chars);
  return (
    <span>
      {Array.from(text).map((ch, i) =>
        set.has(i) ? <span key={i} className="hl">{ch}</span> : <span key={i}>{ch}</span>
      )}
    </span>
  );
}

/* ---------- Waveform ---------- */
export function Waveform({ state = 'idle', bars = 22 }) {
  // state: idle | live | play
  const heights = useRef(Array.from({ length: bars }, () => 20 + Math.random() * 60));
  return (
    <div className={`wave ${state}`}>
      {heights.current.map((h, i) => (
        <i key={i} style={{ height: state === 'idle' ? 14 : h, animationDelay: `${(i % 6) * 80}ms` }} />
      ))}
    </div>
  );
}

/* ---------- Top bar ---------- */
export function TopBar({ title, onBack, right, scrolled }) {
  return (
    <div className={`topbar${scrolled ? ' topbar--scrolled' : ''}`}>
      {onBack && (
        <button className="topbar__back" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
      )}
      {title && <div className="topbar__title">{title}</div>}
      <div className="topbar__spacer" />
      {right}
    </div>
  );
}

/* ---------- Wordmark + dot device ---------- */
export function Wordmark({ name = true }) {
  return (
    <span className="wordmark">
      <span className="wordmark__tile"><b>t</b></span>
      {name && <span className="wordmark__name">tirio</span>}
    </span>
  );
}
export function DotMark() {
  return <span className="dotmark"><span className="d1" /><span className="d2" /><span className="d3" /></span>;
}

/* ---------- Toggle ---------- */
export function Toggle({ on, onClick, label }) {
  return (
    <button className={`toggle${on ? ' on' : ''}`} onClick={onClick} role="switch" aria-checked={on} aria-label={label}><i /></button>
  );
}
