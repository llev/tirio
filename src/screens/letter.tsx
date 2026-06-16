'use client';
/* ============================================================
   Tirio — letter detail + parent layers
   LetterDetail · ParentReference · ParentSupplemental
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import D from '@/lib/data';
import { audioPathById } from '@/lib/content-adapter';
import { Icon, Button, AudioButton, ArtSlot, EngDots, Welsh, TopBar } from '@/components/primitives';
import { layerCount } from '@/screens/shell';

export const LAYERS = [
  { key: 'reference',    title: 'Learn it',       welsh: 'Parent reference',     route: 'reference' },
  { key: 'supplemental', title: 'Practise it',    welsh: 'Parent supplemental',  route: 'supplemental' },
  { key: 'family',       title: 'Play together',  welsh: 'Family activity',      route: 'family' },
  { key: 'challenge',    title: 'Take it further', welsh: 'Family challenge',    route: 'challenge' },
];

export function getLetter(id){ return D.letters.find(l => l.id === id); }
export function suggestedLayer(e){ for(const L of LAYERS){ if(!e || !e[L.key]) return L.key; } return null; }
// the layer that follows `key` in the Ways-to-play sequence (or null at the end)
export function nextLayer(key){ const i = LAYERS.findIndex(L => L.key === key); return (i >= 0 && i < LAYERS.length - 1) ? LAYERS[i + 1] : null; }

/* shared: the four Ways-to-play entry points (used on letter + reference) */
export function WaysToPlay({ id, go, eng, color }){
  const e = (eng && eng[id]) || {};
  const sugg = suggestedLayer(e);
  return (
    <div className="ld__section">
      <h2 className="ld__h">Ways to play</h2>
      <div className="layers">
        {LAYERS.map((L, i) => {
          const done = !!e[L.key];
          const isSugg = L.key === sugg;
          return (
            <button key={L.key} className={`layer${isSugg ? ' layer--suggested' : ''}`}
              onClick={() => go(L.route, { id })}>
              <span className="layer__num" style={{ background: done ? `var(--tile-${color})` : 'var(--surface-sunken)', color: done ? 'var(--ink)' : 'var(--text-secondary)' }}>{i + 1}</span>
              <span className="layer__body">
                <span className="layer__title">{L.title}</span>
                <span className="layer__welsh">{L.welsh}</span>
              </span>
              <span className="layer__right">
                {isSugg && <span className="layer__suggest-tag">Start here</span>}
                {done && <span className="layer__suggest-tag" style={{ color: 'var(--text-secondary)' }}>Explored</span>}
                <span className="layer__dots"><i className={done ? 'on' : ''} /></span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* shared: a word shown as a card (letter-page style), keeping pron + notes detail */
export function RefWordCard({ word, sneaky, i, play, playingId }){
  return (
    <div className="tr-wordcard">
      <div className="tr-wordcard__art">
        {word.art
          ? <img className="tr-wordcard__img" src={word.art} alt={word.alt || word.english} draggable="false" />
          : <ArtSlot label={word.alt || word.english} />}
      </div>
      <div className="tr-wordcard__welsh">{sneaky ? <Welsh text={word.welsh} chars={word.highlight} /> : word.welsh}</div>
      <div className="tr-wordcard__en">{word.english}</div>
      {word.notes ? <div className="tr-wordcard__notes">{word.notes}</div> : null}
      <div className="tr-wordcard__row">
        <span className="tr-wordcard__pron">{word.pron}</span>
        <AudioButton id={`rw-${i}`} size={44} ghost play={play} playingId={playingId} label={`Hear ${word.welsh}`} text={word.welsh} audioPath={audioPathById[word.id]} />
      </div>
    </div>
  );
}

/* ============================================================ LETTER DETAIL */
export function LetterDetail({ id, go, eng, mark, play, playingId, tweaks }) {
  const l = getLetter(id);
  const e = eng[id] || {};
  const [scrolled, setScrolled] = useState(false);
  const sugg = suggestedLayer(e);
  const cvar = { '--tile-c': `var(--tile-${l.color})` };

  return (
    <div className="screen ld">
      <TopBar title={l.letter} onBack={() => go('alphabet')} scrolled={scrolled}
        right={<EngDots n={layerCount(eng, id)} />} />
      <div className="screen__scroll ld__scroll" onScroll={e2 => setScrolled(e2.target.scrollTop > 6)}>

        <div className="ld__hero" style={cvar}>
          <span className={`ld__letter${l.digraph ? ' ld__digraph' : ''}`} onClick={() => play('letter', l.letter, audioPathById[l.id])}>{l.letter}</span>
          <div className="ld__name">{l.name}</div>
          <div className="ld__pron">{l.pron}</div>
          <button className="ld__audio-hint" onClick={() => play('letter', l.letter, audioPathById[l.id])} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}>
            <Icon name="sound" size={18} /> Tap the letter to hear it
          </button>
        </div>

        {/* four layers */}
        <WaysToPlay id={id} go={go} eng={eng} color={l.color} />
      </div>
    </div>
  );
}

/* ============================================================ PARENT REFERENCE */
export function ParentReference({ id, go, eng, mark, play, playingId }) {
  const l = getLetter(id);
  useEffect(() => { mark(id, 'reference'); }, [id]);
  const items = l.sneaky ? l.examples : l.words;

  return (
    <div className="screen layerscreen">
      <TopBar title="Learn it" onBack={() => go('letter', { id })} />
      <div className="screen__scroll layerscreen__scroll">
        <div className="layerscreen__head">
          <div className="layerscreen__kicker">Parent reference · at your own pace</div>
          <div className="layerscreen__title">{l.letter} — {l.pron}</div>
        </div>

        <div className="ref-letter" style={{ '--tile-c': `var(--tile-${l.color})` }}>
          <span className="ref-letter__big">{l.letter}</span>
          <span className="ref-letter__body">
            <span className="ref-letter__desc">{l.description}</span>
            <span className="ref-letter__pron">Sounds like: {l.pron}</span>
          </span>
          <AudioButton id="letter" size={56} play={play} playingId={playingId} label={`Hear ${l.letter}`} text={l.letter} audioPath={audioPathById[l.id]} />
        </div>

        {l.sneaky && <p className="muted" style={{ fontSize: 17, margin: '0 0 16px' }}>These words show {l.letter} hiding inside. The sneaky sound is picked out in colour.</p>}

        <div className="words-grid">
          {items.map((w, i) => (
            <RefWordCard key={w.id || i} word={w} sneaky={l.sneaky} i={i} play={play} playingId={playingId} />
          ))}
        </div>

        {/* jump into any way to play */}
        <WaysToPlay id={id} go={go} eng={eng} color={l.color} />

        <div className="transition-prompt">
          <b>Ready to practise?</b>
          <Button kind="ink" arrow onClick={() => go('supplemental', { id })}>Practise it</Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ PARENT SUPPLEMENTAL (listen & find) */
export function ParentSupplemental({ id, go, mark, play, playingId, tweaks }) {
  const l = getLetter(id);
  // build a pool of words: this letter's words, padded from neighbours
  const pool = useRef(null);
  if (!pool.current) {
    let words = (l.words || []).slice();
    if (words.length < 4) {
      const extra = D.letters.flatMap(x => x.words || []).filter(w => !words.find(o => o.welsh === w.welsh));
      while (words.length < 4 && extra.length) words.push(extra.splice(Math.floor(Math.random() * extra.length), 1)[0]);
    }
    // up to 4 rounds, target rotates
    const rounds = words.slice(0, Math.min(4, words.length)).map((target, i) => {
      const opts = [target];
      const others = words.filter(w => w.welsh !== target.welsh);
      while (opts.length < 4 && others.length) opts.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
      return { target, opts: shuffle(opts) };
    });
    pool.current = rounds;
  }
  const rounds = pool.current;
  const [ri, setRi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState([]); // per round: 'right'|'wrong'
  const round = rounds[ri];
  const done = ri >= rounds.length;

  useEffect(() => { if (done) mark(id, 'supplemental'); }, [done]);

  function pick(w) {
    if (picked) return;
    const ok = w.welsh === round.target.welsh;
    setPicked(w.welsh);
    setStatus(s => [...s, ok ? 'right' : 'wrong']);
    play(`opt-${w.welsh}`, w.welsh, audioPathById[w.id]);
    setTimeout(() => { setPicked(null); setRi(i => i + 1); }, ok ? 950 : 1500);
  }

  if (done) {
    const right = status.filter(s => s === 'right').length;
    return (
      <div className="screen layerscreen">
        <TopBar title="Practise it" onBack={() => go('letter', { id })} />
        <div className="li">
          <div className="fa__burst" style={{ color: 'var(--text-primary)' }}>Nice work.</div>
          <p className="muted center" style={{ fontSize: 19, maxWidth: '24ch' }}>
            You found {right} of {rounds.length}. There's no score here — practise as often as you like.
          </p>
          <div className="fa__actions">
            <button className="fa-btn fa-btn--ink" onClick={() => { pool.current = null; setRi(0); setStatus([]); }}><Icon name="refresh" size={20} /> Again</button>
            <Button kind="primary" size="lg" arrow onClick={() => go('family', { id })}>Play with the family</Button>
          </div>
        </div>
      </div>
    );
  }

  const wrongPick = picked && picked !== round.target.welsh;
  return (
    <div className="screen layerscreen">
      <TopBar title="Practise it" onBack={() => go('letter', { id })}
        right={<div className="li__progress">{rounds.map((_, i) => <i key={i} className={i < ri ? (status[i] === 'right' ? 'done' : 'on') : i === ri ? 'on' : ''} />)}</div>} />
      <div className="li">
        <div className="li__prompt">Which word is "{round.target.english}"?</div>
        <div className="li__play">
          <AudioButton id={`target-${ri}`} size={72} play={play} playingId={playingId} label="Hear it again" text={round.target.welsh} audioPath={audioPathById[round.target.id]} />
        </div>
        <p className="muted" style={{ marginTop: -8, fontSize: 14 }}>Tap to hear it · then pick the Welsh word</p>
        <div className="li__options">
          {round.opts.map(w => {
            let cls = 'li-opt';
            if (picked) {
              if (w.welsh === round.target.welsh) cls += ' correct';
              else if (w.welsh === picked) cls += ' wrong';
            }
            return (
              <button key={w.welsh} className={cls} style={{ fontSize: 30, padding: 16, lineHeight: 1.05 }} onClick={() => pick(w)}>
                {w.welsh}
              </button>
            );
          })}
        </div>
        {wrongPick && <div className="tr-feedback tr-feedback--neutral" style={{ maxWidth: 460 }}>
          <span className="tr-feedback__dot"><Icon name="check" size={16} /></span>
          Almost — "{round.target.welsh}" is the one. Here it is.
        </div>}
      </div>
    </div>
  );
}

export function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
