'use client';
/* ============================================================
   Tirio — family-register screens (content register: bold)
   FamilyHub · FamilyRecord · WordBuilder · Challenge(Deck/Full/Away/Return)
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import D from '@/lib/data';
import { sayTogetherRefs, allWordsById, audioPathById } from '@/lib/content-adapter';
import { Icon, Button, AudioButton, ArtSlot, Waveform, TopBar, DotMark, useSimAudio, useAudioRecorder } from '@/components/primitives';
import { getLetter, shuffle } from '@/screens/letter';

const DIGRAPHS = ['Ch','Dd','Ff','Ng','Ll','Ph','Rh','Th'];
export function welshTokens(word){
  // split into Welsh letters; merge known digraphs.
  const up = word.toUpperCase();
  const out = []; let i = 0;
  while (i < up.length){
    const two = up.slice(i, i+2);
    if (DIGRAPHS.map(d=>d.toUpperCase()).includes(two)){ out.push(two); i += 2; }
    else { out.push(up[i]); i += 1; }
  }
  return out;
}
function subtractMultiset(pool, remove){
  const r = remove.slice(); const out = [];
  pool.forEach(x => { const k = r.indexOf(x); if (k>=0) r.splice(k,1); else out.push(x); });
  return out;
}

/* ============================================================ FAMILY HUB */
export function FamilyHub({ id, go, flags, mark, playDifferently }) {
  const l = getLetter(id);
  const acts = [
    { id: 'say',     title: 'Say it together', welsh: "Pawb gyda'i gilydd", desc: 'Record the whole family saying it — then hear yourselves back.', color: 'coral', route: () => go('family-record', { id }) },
    { id: 'arrange', title: 'Build the word',  welsh: 'Trefnwch y gair',   desc: 'The letters are all here. Put them in order to make a Welsh word.', color: 'teal', route: () => go('wordbuilder', { id, variant: 'arrange' }) },
    { id: 'tap',     title: 'Spell it out',    welsh: 'Sillafwch y gair',  desc: 'Tap the letters one by one — no clues this time.', color: 'indigo', route: () => go('wordbuilder', { id, variant: 'tap' }), locked: !flags.arrangeDone },
  ];
  return (
    <div className="screen layerscreen">
      <TopBar title="Play together" onBack={() => go('letter', { id })} />
      <div className="screen__scroll layerscreen__scroll">
        <div className="layerscreen__head">
          <div className="layerscreen__kicker">Family activity · everyone around the screen</div>
          <div className="layerscreen__title">Play with {l.letter}</div>
        </div>
        {playDifferently && (
          <div className="tr-feedback tr-feedback--neutral" style={{ marginBottom: 16 }}>
            <span className="tr-feedback__dot"><Icon name="heart" size={16} /></span>
            Play differently is on — each activity offers a no-recording way to join in.
          </div>
        )}
        <div className="layers">
          {acts.map(a => (
            <button key={a.id} className="layer" onClick={a.locked ? undefined : a.route} style={a.locked ? { opacity: .55 } : null}>
              <span className="layer__num" style={{ background: `var(--tile-${a.color})`, color: 'var(--ink)' }}>
                {a.id === 'say' ? <Icon name="mic" size={22} /> : <Icon name="fwd" size={22} />}
              </span>
              <span className="layer__body">
                <span className="layer__title">{a.title}</span>
                <span className="layer__welsh">{a.desc}</span>
              </span>
              <span className="layer__right">
                {a.locked
                  ? <span className="layer__suggest-tag" style={{ color: 'var(--text-secondary)' }}>After Build the word</span>
                  : <span className="topic-card__arrow">→</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ FAMILY RECORD / PLAYBACK */
export function FamilyRecord({ id, go, mark, tweaks, playDifferently }) {
  const general = !id;
  const l = id ? getLetter(id) : null;
  const _refs = !general ? (sayTogetherRefs[id] || []).map(wid => allWordsById[wid]).filter(Boolean) : [];
  const pool = general
    ? D.buildable
    : (_refs.length ? _refs : (l?.words?.length ? l.words : [{ welsh: l?.letter || '', english: l?.name || '' }]));
  const [poolIdx, setPoolIdx] = useState(() => Math.floor(Math.random() * pool.length));
  const word = pool[poolIdx % pool.length];
  const glyph = general ? word.letter : l.letter;
  const color = general ? (word.color || 'coral') : l.color;
  const [phase, setPhase] = useState(playDifferently && !general ? 'alt' : 'ready'); // ready | rec | think | play | done | alt
  const [playingId, play] = useSimAudio(); // word audio (no real files — simulated pulse)
  const recorder = useAudioRecorder();
  const cvar = { '--tile-c': `var(--tile-${color})` };
  const timers = useRef([]);
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function startRec() {
    const ok = await recorder.start();
    if (!ok) return; // micError shown in the UI
    setPhase('rec');
    after(2600, stopRec);
  }
  function stopRec() {
    timers.current.forEach(clearTimeout);
    recorder.stop();
    setPhase('think');
  }
  // When the blob is ready during 'think', auto-play it then advance to 'done'
  useEffect(() => {
    if (phase === 'think' && recorder.hasRecording) {
      setPhase('play');
      recorder.playOnce(() => after(200, () => setPhase('done')));
    }
  }, [phase, recorder.hasRecording]);

  function reset() { timers.current.forEach(clearTimeout); recorder.reset(); setPhase('ready'); }
  function skipWord() {
    timers.current.forEach(clearTimeout);
    recorder.reset();
    setPoolIdx(i => i + 1);
    setPhase('ready');
  }
  function finish() { if (!general) mark(id, 'family'); go(general ? 'alphabet' : 'challenge', general ? {} : { id }); }

  return (
    <div className="fa" style={cvar}>
      <div className="fa__bar">
        <button className="fa__close" onClick={() => go(general ? 'alphabet' : 'family', general ? {} : { id })} aria-label="Close"><Icon name="close" /></button>
        <span className="fa__kicker">
          {general
            ? 'Any word · Say it together'
            : pool.length > 1
              ? `Word ${(poolIdx % pool.length) + 1} of ${pool.length}`
              : 'Family activity · Say it together'}
        </span>
        {phase !== 'done' && pool.length > 1 && (
          <button className="fa__skip" onClick={skipWord}><Icon name="refresh" size={16} /> Another word</button>
        )}
      </div>

      <div className="fa__body">
        {phase === 'alt' ? (
          <>
            <span className="fa__word">{glyph}</span>
            <span className="fa__prompt">Find something that starts with "{glyph}" — point to it together.</span>
            <div className="fa__actions">
              <button className="fa-btn fa-btn--ink" onClick={() => setPhase('ready')}><Icon name="mic" size={20} /> Use recording instead</button>
              <button className="fa-btn fa-btn--paper" onClick={finish}>We found one</button>
            </div>
          </>
        ) : phase === 'done' ? (
          <div className="fa__celebrate">
            <span className="fa__burst">Dyna chi! 🎉</span>
            <span className="fa__en" style={{ opacity: .9 }}>That's you, speaking Welsh.</span>
            <Waveform state={recorder.isPlaying ? 'play' : 'idle'} />
            <button className={`fa-playback${recorder.isPlaying ? ' is-playing' : ''}`} onClick={() => recorder.replay()}>
              <span className="fa-playback__icon"><Icon name={recorder.isPlaying ? 'sound' : 'play'} size={22} /></span>
              {recorder.isPlaying ? 'Playing your recording…' : 'Hear your recording'}
            </button>
            <div className="fa__actions">
              <button className="fa-btn fa-btn--ghost" onClick={general ? skipWord : reset}><Icon name="refresh" size={20} /> {general ? 'Another word' : 'Do it again'}</button>
              {!general && pool.length > 1 && (
                <button className="fa-btn fa-btn--ghost" onClick={skipWord}><Icon name="refresh" size={20} /> Another word</button>
              )}
              <button className="fa-btn fa-btn--ink" onClick={finish}>{general ? 'Done →' : 'Next game →'}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="stack" style={{ alignItems: 'center', gap: 4 }}>
              <span className="fa__word fa__word--tap" role="button" tabIndex={0} aria-label={`Hear ${word.welsh}`} onClick={() => play('word', word.welsh, audioPathById[word.id])}>{word.welsh}</span>
              <span className="fa__en">{word.english}</span>
              {phase === 'ready' && (
                <button className="fa__hear" onClick={() => play('word', word.welsh, audioPathById[word.id])}>
                  <Icon name="sound" size={18} /> {playingId === 'word' ? 'Playing…' : 'Tap the word to hear it'}
                </button>
              )}
            </div>

            {phase === 'ready' && <>
              {recorder.micError && (
                <p className="fa__prompt" style={{ fontSize: 14, opacity: .75, maxWidth: '28ch', textAlign: 'center' }}>
                  Mic access was denied — check your browser settings and try again.
                </p>
              )}
              <span className="fa__prompt">Everyone ready?<br />Tap to record.</span>
              {tweaks.recordStyle === 'bar'
                ? <button className="rec-bar" onClick={startRec}><span className="rec-bar__dot" /> Tap to record</button>
                : <button className="rec" onClick={startRec}><span className="rec__icon" /><span className="rec__label">Record</span></button>}
            </>}

            {phase === 'rec' && <>
              <Waveform state="live" />
              {tweaks.recordStyle === 'bar'
                ? <button className="rec-bar is-rec" onClick={stopRec}><span className="rec-bar__dot" /> Listening… tap to stop</button>
                : <button className="rec is-rec" onClick={stopRec}><span className="rec__icon" /><span className="rec__label">Stop</span></button>}
            </>}

            {phase === 'think' && <p className="fa__prompt" style={{ opacity: .7 }}>One sec…</p>}

            {phase === 'play' && <>
              <Waveform state="play" />
              <p className="fa__welsh">Playing your family back…</p>
            </>}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================ WORD BUILDER */
export function WordBuilder({ id, go, variant: initialVariant, mark, setFlag, flags }) {
  const general = !id;
  const [variant, setVariant] = useState(initialVariant || 'arrange');
  const [wi, setWi] = useState(() => Math.floor(Math.random() * D.buildable.length));
  const word = D.buildable[wi];
  const answer = useRef(welshTokens(word.welsh));
  const cvar = { '--tile-c': `var(--tile-${word.color})` };

  // arrange pool: answer + decoys (from build), each an instance with id
  const makePool = () => {
    const ans = welshTokens(word.welsh);
    const decoys = subtractMultiset(word.build, ans);
    return shuffle(ans.concat(decoys)).map((ch, i) => ({ id: i, ch }));
  };
  const [pool, setPool] = useState(makePool);
  const [slots, setSlots] = useState(() => answer.current.map(() => null)); // hold pool item id (arrange) or token (tap)
  const [nudge, setNudge] = useState(false);
  const [solved, setSolved] = useState(false);

  function resetWord(next){
    const w = next != null ? next : wi;
    setWi(w);
    const word2 = D.buildable[w];
    answer.current = welshTokens(word2.welsh);
    const ans = welshTokens(word2.welsh);
    const decoys = subtractMultiset(word2.build, ans);
    setPool(shuffle(ans.concat(decoys)).map((ch, i) => ({ id: i, ch })));
    setSlots(ans.map(() => null));
    setSolved(false); setNudge(false);
  }
  useEffect(() => { resetWord(); /* on variant change keep word */ }, [variant]);

  // place / remove for ARRANGE
  function placeArrange(item){
    if (solved) return;
    const si = slots.indexOf(null); if (si < 0) return;
    const ns = slots.slice(); ns[si] = item.id; setSlots(ns); check(ns, 'arrange');
  }
  function removeArrange(si){
    if (solved) return; const ns = slots.slice(); ns[si] = null; setSlots(ns);
  }
  // place / remove for TAP
  function placeTap(token){
    if (solved) return; const si = slots.indexOf(null); if (si < 0) return;
    const ns = slots.slice(); ns[si] = token; setSlots(ns); check(ns, 'tap');
  }
  function removeTap(si){ if (solved) return; const ns = slots.slice(); ns[si] = null; setSlots(ns); }

  function check(ns, mode){
    if (ns.includes(null)) return;
    const placed = mode === 'arrange' ? ns.map(pid => pool.find(p => p.id === pid).ch) : ns.slice();
    const ok = placed.every((ch, i) => ch === answer.current[i]);
    if (ok){
      setSolved(true);
      if (id) mark(id, 'family');
      if (variant === 'arrange') setFlag('arrangeDone', true);
    } else {
      setNudge(true);
      setTimeout(() => { setNudge(false); setSlots(answer.current.map(() => null)); }, 700);
    }
  }

  const placedIds = new Set(slots.filter(x => x != null));

  return (
    <div className="wb">
      <TopBar title="Word builder" onBack={() => general ? go('alphabet') : go('family', { id })}
        right={<button className="topbar__back" style={{ width: 'auto', padding: '0 14px', fontFamily: 'var(--font-body)', fontWeight: 600 }} onClick={() => resetWord(Math.floor(Math.random() * D.buildable.length))}>Another</button>} />
      <div className="wb__body">
        <div className="wb-variants">
          <button className={`wb-variant${variant === 'arrange' ? ' on' : ''}`} onClick={() => setVariant('arrange')}>Build the word</button>
          <button className={`wb-variant${variant === 'tap' ? ' on' : ''}`} disabled={!flags.arrangeDone} onClick={() => flags.arrangeDone && setVariant('tap')}>
            Spell it out{!flags.arrangeDone ? ' 🔒' : ''}
          </button>
        </div>

        <div className="wb__art" style={cvar}>{word.art ? <img className="wb__art-img" src={word.art} alt={word.alt || word.english} draggable="false" /> : <ArtSlot label={word.alt || word.english} />}</div>
        <div className="wb__en">{word.english}</div>

        {solved ? (
          <div className="wb__reveal">
            <span className="wb__reveal-word" style={cvar}>{word.welsh}</span>
            <AudioButtonStandalone label={`Hear ${word.welsh}`} />
            <div className="fa__actions">
              <button className="fa-btn fa-btn--ghost" style={{ color: 'var(--text-primary)', background: 'var(--surface-sunken)' }} onClick={() => resetWord(Math.floor(Math.random() * D.buildable.length))}>Another word</button>
              <button className="fa-btn fa-btn--ink" onClick={() => general ? go('alphabet') : go('challenge', { id })}>{general ? 'Done →' : 'Next game →'}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="wb__prompt">{variant === 'arrange' ? 'Put the letters in the right order.' : 'Tap the letters to spell it. Digraphs are single tiles.'}</div>
            <div className={`wb__slots${nudge ? ' nudge' : ''}`}>
              {slots.map((val, si) => {
                const token = variant === 'arrange' ? (val != null ? pool.find(p => p.id === val).ch : null) : val;
                const wide = token && token.length > 1;
                return (
                  <div key={si} className={`wb-slot${token ? ' filled' : ''}${wide ? ' wb-slot--wide' : ''}${nudge ? ' nudge' : ''}`}
                    onClick={() => token && (variant === 'arrange' ? removeArrange(si) : removeTap(si))}>
                    {token && <span className={`wb-tile placed${wide ? ' wb-tile--wide' : ''}${nudge ? ' nudge' : ''}`} style={cvar}>{token}</span>}
                  </div>
                );
              })}
            </div>

            {variant === 'arrange' ? (
              <>
                <div className="wb__poollabel">Letters</div>
                <div className="wb__pool">
                  {pool.map(item => (
                    <button key={item.id} className={`wb-tile${item.ch.length > 1 ? ' wb-tile--wide' : ''}${placedIds.has(item.id) ? ' used' : ''}`}
                      style={cvar} onClick={() => placeArrange(item)}>{item.ch}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="wb__poollabel">Welsh alphabet · tap to spell</div>
                <div className="wb-grid">
                  {TAP_GRID.map(ch => (
                    <button key={ch} className={`wb-tile${ch.length > 1 ? ' wb-tile--wide' : ''}`} style={cvar} onClick={() => placeTap(ch)}>{ch}</button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
// curated tap grid: letters used across buildable words + all digraphs (single tiles)
export const TAP_GRID = ['A','B','C','D','E','G','H','I','J','L','M','N','O','P','T','W','Y','Â','Ê','Ŷ','Ch','Dd','Ff','Ll'];

function AudioButtonStandalone({ label }){
  const [p, play] = useSimAudio();
  return <AudioButton id="rev" size={56} play={play} playingId={p} label={label} />;
}

/* ============================================================ CHALLENGE */
const CHL_COLORS = { challenge_secret_letter: 'indigo', challenge_repeat_and_beat: 'coral', challenge_letter_of_the_day: 'gold' };

export function ChallengeDeck({ id, go }) {
  const l = id ? getLetter(id) : null;
  return (
    <div className="chl">
      <TopBar title="Take it further" onBack={() => go(id ? 'letter' : 'home', id ? { id } : {})} />
      <div className="chl__deck" style={{ justifyContent: 'flex-start', overflowY: 'auto' }}>
        <p className="muted" style={{ margin: '0 0 4px', fontSize: 17 }}>Pick a challenge. These happen away from the screen.</p>
        {D.challenges.map(c => (
          <button key={c.id} className={`chl-card tr-challenge--${CHL_COLORS[c.id]}`} style={{ overflow: 'unset', '--tile-c': `var(--tile-${CHL_COLORS[c.id]})` }}
            onClick={() => go('challenge-full', { id, challenge: c.id })}>
            <span className="chl-card__kicker">{c.category}</span>
            <span className="chl-card__title">{c.title}</span>
            <span className="chl-card__how">{c.prompt}</span>
            <span className="chl-card__dur">{c.duration.replace('_', ' ')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChallengeFull({ id, challenge, go, mark }) {
  const c = D.challenges.find(x => x.id === challenge);
  const color = CHL_COLORS[c.id];
  const welsh = { challenge_secret_letter: 'Pawb i chwilio!', challenge_repeat_and_beat: "Pwy sy'n cofio?", challenge_letter_of_the_day: 'Llythyren y dydd' }[c.id];
  return (
    <div className="fa" style={{ '--tile-c': `var(--tile-${color})`, background: `var(--tile-${color})` }}>
      <div className="fa__bar">
        <button className="fa__close" onClick={() => go('challenge', id ? { id } : {})} aria-label="Close"><Icon name="close" /></button>
        <span className="fa__kicker">Challenge card</span>
      </div>
      <div className="chl-full">
        <span className="chl-full__kicker">{c.category} · {c.duration.replace('_', ' ')}</span>
        <span className="chl-full__title">{c.title}</span>
        <span className="chl-full__how">{c.prompt}</span>
        <span className="chl-full__welsh">{welsh}</span>
        <span className="chl-full__alt"><strong>Another way:</strong> {c.alternative}</span>
        <div className="chl-full__go">
          <button className="away__back" onClick={() => { if (id) mark(id, 'challenge'); go('challenge-away', { id, challenge }); }}>Let's go →</button>
        </div>
      </div>
    </div>
  );
}

export function ChallengeAway({ id, challenge, go }) {
  const c = D.challenges.find(x => x.id === challenge);
  const [mode, setMode] = useState(c.duration === 'one_day' ? 'timer' : 'card'); // card | dim | timer
  const [secs, setSecs] = useState(0);
  useEffect(() => { const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (mode !== 'dim') return; // auto-dim handled by class
  }, [mode]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');

  return (
    <div className={`away${mode === 'dim' ? ' away--dim' : ''}`} style={{ '--tile-c': `var(--tile-${CHL_COLORS[c.id]})`, background: mode === 'dim' ? undefined : `var(--tile-${CHL_COLORS[c.id]})` }}>
      <span className="away__name">{c.title}</span>
      {mode === 'timer' && <span className="away__timer">{mm}:{ss}</span>}
      <span className="away__hint">{mode === 'dim' ? "Tap when you're ready to come back." : "The app is waiting. Go and play — come back when you're done."}</span>
      <button className="away__back" onClick={() => go('challenge-return', { id, challenge })}>We're back</button>
      <div className="away__modes">
        {['card', 'dim', 'timer'].map(m => (
          <button key={m} className={`away__mode${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}><span>{m}</span></button>
        ))}
      </div>
    </div>
  );
}

export function ChallengeReturn({ id, challenge, go }) {
  const [ans, setAns] = useState(null);
  const opts = [
    { k: 'go', t: 'We gave it a go' },
    { k: 'loved', t: 'We loved it' },
    { k: 'nope', t: "Didn't quite work today" },
  ];
  const ack = { go: 'Lovely. That counts.', loved: 'Wonderful — do it again soon.', nope: "That's fine. Come back to it." };
  return (
    <div className="ret">
      {ans ? (
        <>
          <DotMark />
          <div className="ret__ack">{ack[ans]}</div>
          <div className="ret__opts">
            <Button kind="primary" size="lg" block onClick={() => go(id ? 'letter' : 'home', id ? { id } : {})}>Back to {id ? getLetter(id).letter : 'home'}</Button>
          </div>
        </>
      ) : (
        <>
          <div className="ret__title">You're back!</div>
          <div className="ret__q">How did it go?</div>
          <div className="ret__opts">
            {opts.map(o => <button key={o.k} className="ret-opt" onClick={() => setAns(o.k)}>{o.t}</button>)}
          </div>
          <button className="ret__skip" onClick={() => go(id ? 'letter' : 'home', id ? { id } : {})}>Skip</button>
        </>
      )}
    </div>
  );
}
