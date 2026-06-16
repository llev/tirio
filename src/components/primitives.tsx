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

/* ---------- Audio simulation ---------- */
// No real audio in the prototype — this fakes a "playing" pulse for a beat.
export function useSimAudio() {
  const [playingId, setPlayingId] = useState(null);
  const tid = useRef(null);
  const play = useCallback((id, ms = 1200) => {
    clearTimeout(tid.current);
    setPlayingId(id);
    tid.current = setTimeout(() => setPlayingId(null), ms);
  }, []);
  useEffect(() => () => clearTimeout(tid.current), []);
  return [playingId, play];
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
export function AudioButton({ id, label, ghost, size = 48, play, playingId, onPlay }) {
  const playing = playingId === id;
  return (
    <button className={`tr-audio${ghost ? ' tr-audio--ghost' : ''}${playing ? ' is-playing' : ''}`}
      style={{ width: size, height: size }} aria-label={label || 'Play audio'}
      onClick={(e) => { e.stopPropagation(); play(id); onPlay && onPlay(); }}>
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
