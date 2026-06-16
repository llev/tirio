'use client';
/* ============================================================
   Tirio — Amser Bwyd (Dinner Time) topic
   Topic overview · Reference · Supplemental (phrase builder + listen)
   Family hub · Say it together · Plate builder · Café Cymraeg
   Challenge deck / full / away / return
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import DDdata from '@/lib/data-dinner';
import { Icon, Button, AudioButton, Waveform, EngDots, TopBar, useSimAudio } from '@/components/primitives';
import { layerCount } from '@/screens/shell';
import { RefWordCard } from '@/screens/letter';

export const DD = DDdata;

export const DLAYERS = [
  { key: 'reference',    title: 'Learn it',        sub: 'The words and phrases, at your pace',   route: 'dinner-reference',    color: 'gold',   icon: 'sound' },
  { key: 'supplemental', title: 'Practise it',     sub: 'Build a phrase · listen and find',      route: 'dinner-supplemental', color: 'teal',   icon: 'check' },
  { key: 'family',       title: 'Play together',   sub: 'Say it · build a plate · Café Cymraeg',  route: 'dinner-family',       color: 'coral',  icon: 'mic' },
  { key: 'challenge',    title: 'Take it further', sub: 'Four challenges away from the screen',   route: 'dinner-challenge',    color: 'indigo', icon: 'spark' },
];
function dinnerSuggested(e){ for (const L of DLAYERS){ if (!e || !e[L.key]) return L.key; } return null; }
export function dShuffle(a){ a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
export function wordsByIds(ids){ return ids.map(id => DD.wordById[id]).filter(Boolean); }

/* shared: the four ways to play for the dinner topic */
export function DinnerWays({ go, eng }){
  const e = (eng && eng['dinner']) || {};
  const sugg = dinnerSuggested(e);
  return (
    <div className="ld__section">
      <h2 className="ld__h">Ways to play</h2>
      <div className="layers">
        {DLAYERS.map((L, i) => {
          const done = !!e[L.key];
          const isSugg = L.key === sugg;
          return (
            <button key={L.key} className={`layer${isSugg ? ' layer--suggested' : ''}`} onClick={() => go(L.route, {})}>
              <span className="layer__num" style={{ background: done ? `var(--tile-${L.color})` : 'var(--surface-sunken)', color: done ? 'var(--ink)' : 'var(--text-secondary)' }}>
                <Icon name={L.icon} size={22} />
              </span>
              <span className="layer__body">
                <span className="layer__title">{L.title}</span>
                <span className="layer__welsh">{L.sub}</span>
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

/* ============================================================ TOPIC OVERVIEW */
export function DinnerTopic({ go, eng }){
  const [scrolled, setScrolled] = useState(false);
  const preview = DD.wordGroups[1].words.slice(0, 6); // food chips
  return (
    <div className="screen ld">
      <TopBar title="Amser Bwyd" onBack={() => go('home')} scrolled={scrolled} right={<EngDots n={layerCount(eng, 'dinner')} />} />
      <div className="screen__scroll ld__scroll" onScroll={e => setScrolled(e.target.scrollTop > 6)}>
        <div className="dn-hero">
          <span className="dn-hero__kicker">Pwnc · Topic · De Cymru</span>
          <span className="dn-hero__title">Amser Bwyd</span>
          <span className="dn-hero__en">Dinner Time</span>
          <p className="dn-hero__blurb">{DD.topic.blurb}</p>
          <div className="dn-hero__chips">
            {preview.map(w => <span key={w.id} className="dn-chip">{w.welsh}</span>)}
            <span className="dn-chip dn-chip--more">+{DD.allWords.length - preview.length}</span>
          </div>
        </div>
        <DinnerWays go={go} eng={eng} />
      </div>
    </div>
  );
}

/* ============================================================ LEARN IT (reference) */
function DinnerPhraseCard({ p, play, playingId }){
  return (
    <div className="dn-phrase">
      <div className="dn-phrase__top">
        <span className="dn-phrase__en">{p.natural}</span>
        <AudioButton id={`ph-${p.id}`} size={44} ghost play={play} playingId={playingId} label={`Hear ${p.welsh}`} />
      </div>
      <div className="dn-phrase__welsh">{p.welsh}</div>
      <div className="dn-phrase__blocks">
        {p.blocks.map((b, i) => <span key={i} className="dn-block">{b.welsh}</span>)}
      </div>
      <div className="dn-phrase__pron">{p.pron}</div>
      {p.context ? <div className="dn-phrase__ctx">{p.context}</div> : null}
    </div>
  );
}

export function DinnerReference({ go, eng, mark }){
  const [playingId, play] = useSimAudio();
  useEffect(() => { mark('dinner', 'reference'); }, []);
  return (
    <div className="screen layerscreen">
      <TopBar title="Learn it" onBack={() => go('dinner')} />
      <div className="screen__scroll layerscreen__scroll">
        <div className="layerscreen__head">
          <div className="layerscreen__kicker">Parent reference · at your own pace</div>
          <div className="layerscreen__title">Amser Bwyd</div>
        </div>

        {DD.wordGroups.map(g => (
          <div key={g.key} className="dn-group">
            <div className="dn-group__label"><strong>{g.label}</strong><span>{g.en}</span></div>
            <div className="words-grid">
              {g.words.map((w, i) => <RefWordCard key={w.id} word={w} i={`${g.key}-${i}`} play={play} playingId={playingId} />)}
            </div>
          </div>
        ))}

        <div className="dn-group">
          <div className="dn-group__label"><strong>Ymadroddion</strong><span>Phrases to say at the table</span></div>
          <div className="dn-phrases">
            {DD.phrases.map(p => <DinnerPhraseCard key={p.id} p={p} play={play} playingId={playingId} />)}
          </div>
        </div>

        <div className="transition-prompt">
          <b>Ready to practise?</b>
          <Button kind="ink" arrow onClick={() => go('dinner-supplemental')}>Practise it</Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ PRACTISE IT */
export function DinnerSupplemental({ go, mark, trackPractice }){
  const [mode, setMode] = useState('build'); // build | listen
  return (
    <div className="screen layerscreen">
      <TopBar title="Practise it" onBack={() => go('dinner')} />
      <div className="screen__scroll" style={{ padding: '0 26px 40px', display: 'flex', flexDirection: 'column' }}>
        <div className="wb-variants" style={{ marginTop: 4 }}>
          <button className={`wb-variant${mode === 'build' ? ' on' : ''}`} onClick={() => setMode('build')}>Build the phrase</button>
          <button className={`wb-variant${mode === 'listen' ? ' on' : ''}`} onClick={() => setMode('listen')}>Listen &amp; find</button>
        </div>
        {mode === 'build' ? <PhraseBuilder mark={mark} go={go} trackPractice={trackPractice} /> : <ListenFind mark={mark} trackPractice={trackPractice} />}
      </div>
    </div>
  );
}

const DECOY_BLOCKS = [
  { id: 'plis', welsh: 'plîs' }, { id: 'diolch', welsh: 'Diolch' },
  { id: 'yn_fawr', welsh: 'yn fawr' }, { id: 'dwr', welsh: 'dŵr' }, { id: 'bara', welsh: 'bara' },
];

export function PhraseBuilder({ mark, go, trackPractice }){
  const pool = useRef(dShuffle(DD.builderRefs.slice()));
  const [pi, setPi] = useState(0);
  const phrase = DD.phraseById[pool.current[pi % pool.current.length]];
  const answer = phrase.blocks.map(b => b.id);

  const buildPool = () => {
    const own = phrase.blocks.map((b, i) => ({ key: `o${i}`, id: b.id, welsh: b.welsh }));
    const decoy = DECOY_BLOCKS.filter(d => !answer.includes(d.id));
    const extras = phrase.blocks.length <= 2 && decoy.length
      ? [{ key: 'd0', ...dShuffle(decoy)[0] }] : [];
    return dShuffle(own.concat(extras));
  };
  const [tiles, setTiles] = useState(buildPool);
  const [slots, setSlots] = useState(() => phrase.blocks.map(() => null)); // store tile key
  const [solved, setSolved] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [playingId, play] = useSimAudio();

  function reset(nextIdx){
    const ni = nextIdx != null ? nextIdx : pi;
    setPi(ni);
  }
  useEffect(() => {
    setTiles(buildPool());
    setSlots(phrase.blocks.map(() => null));
    setSolved(false); setNudge(false);
  }, [pi]);

  const usedKeys = new Set(slots.filter(Boolean));

  function place(tile){
    if (solved) return;
    const si = slots.indexOf(null); if (si < 0) return;
    const ns = slots.slice(); ns[si] = tile.key; setSlots(ns);
    if (!ns.includes(null)) check(ns);
  }
  function removeAt(si){ if (solved) return; const ns = slots.slice(); ns[si] = null; setSlots(ns); }
  function check(ns){
    const placed = ns.map(k => tiles.find(t => t.key === k).id);
    const ok = placed.every((id, i) => id === answer[i]);
    if (ok){ setSolved(true); mark('dinner', 'supplemental'); if (trackPractice) trackPractice('phrase'); play('reveal', 1500); }
    else { setNudge(true); setTimeout(() => { setNudge(false); setSlots(phrase.blocks.map(() => null)); }, 750); }
  }

  return (
    <div className="pb">
      <div className="pb__prompt">Put the chunks in order to say:</div>
      <div className="pb__target">“{phrase.natural}”</div>

      {solved ? (
        <div className="pb__reveal">
          <span className="pb__reveal-welsh">{phrase.welsh}</span>
          <AudioButton id="reveal" size={56} play={play} playingId={playingId} label={`Hear ${phrase.welsh}`} />
          <div className="pb__pron">{phrase.pron}</div>
          <div className="fa__actions" style={{ marginTop: 8 }}>
            <button className="fa-btn fa-btn--ghost" style={{ color: 'var(--text-primary)', background: 'var(--surface-sunken)' }} onClick={() => reset((pi + 1) % pool.current.length)}>Another phrase</button>
            <button className="fa-btn fa-btn--ink" onClick={() => go('dinner-family')}>Play together →</button>
          </div>
        </div>
      ) : (
        <>
          <div className={`pb-slots${nudge ? ' nudge' : ''}`}>
            {slots.map((key, si) => {
              const tile = key ? tiles.find(t => t.key === key) : null;
              return (
                <div key={si} className={`pb-slot${tile ? ' filled' : ''}`} onClick={() => tile && removeAt(si)}>
                  {tile ? <span className="pb-block placed">{tile.welsh}</span> : <span className="pb-slot__n">{si + 1}</span>}
                </div>
              );
            })}
          </div>
          <div className="pb__poollabel">Tap the chunks</div>
          <div className="pb__pool">
            {tiles.map(t => (
              <button key={t.key} className={`pb-block${usedKeys.has(t.key) ? ' used' : ''}`} onClick={() => place(t)}>{t.welsh}</button>
            ))}
          </div>
          <p className="muted center" style={{ fontSize: 14, marginTop: 4 }}>Tap a placed chunk to send it back.</p>
        </>
      )}
    </div>
  );
}

export function ListenFind({ mark, trackPractice }){
  const pool = useRef(null);
  if (!pool.current){
    const words = dShuffle(wordsByIds(DD.listenRefs)).slice(0, 6);
    const rounds = words.slice(0, 4).map(target => {
      const opts = [target];
      const others = words.filter(w => w.id !== target.id);
      while (opts.length < 4 && others.length) opts.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
      return { target, opts: dShuffle(opts) };
    });
    pool.current = rounds;
  }
  const rounds = pool.current;
  const [ri, setRi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState([]);
  const [playingId, play] = useSimAudio();
  const done = ri >= rounds.length;
  useEffect(() => { if (done){ mark('dinner', 'supplemental'); if (trackPractice) trackPractice('listen'); } }, [done]);

  if (done){
    const right = status.filter(s => s === 'right').length;
    return (
      <div className="li" style={{ height: 'auto', padding: '40px 0' }}>
        <div className="fa__burst" style={{ color: 'var(--text-primary)' }}>Da iawn!</div>
        <p className="muted center" style={{ fontSize: 19, maxWidth: '26ch' }}>You found {right} of {rounds.length}. No score here — practise as often as you like.</p>
        <button className="fa-btn fa-btn--ink" onClick={() => { pool.current = null; setRi(0); setStatus([]); }}><Icon name="refresh" size={20} /> Again</button>
      </div>
    );
  }
  const round = rounds[ri];
  function pick(w){
    if (picked) return;
    const ok = w.id === round.target.id;
    setPicked(w.id); setStatus(s => [...s, ok ? 'right' : 'wrong']); play(`opt-${w.id}`);
    setTimeout(() => { setPicked(null); setRi(i => i + 1); }, ok ? 900 : 1400);
  }
  const wrongPick = picked && picked !== round.target.id;
  return (
    <div className="li" style={{ height: 'auto', padding: '24px 0 40px', gap: 'var(--space-xl)' }}>
      <div className="li__progress">{rounds.map((_, i) => <i key={i} className={i < ri ? (status[i] === 'right' ? 'done' : 'on') : i === ri ? 'on' : ''} />)}</div>
      <div className="li__prompt">Which one is “{round.target.english}”?</div>
      <AudioButton id={`tgt-${ri}`} size={72} play={play} playingId={playingId} label="Hear it again" />
      <p className="muted" style={{ marginTop: -8, fontSize: 14 }}>Tap to hear it · then pick the Welsh word</p>
      <div className="li__options">
        {round.opts.map(w => {
          let cls = 'li-opt';
          if (picked){ if (w.id === round.target.id) cls += ' correct'; else if (w.id === picked) cls += ' wrong'; }
          return <button key={w.id} className={cls} style={{ fontSize: 30, padding: 16 }} onClick={() => pick(w)}>{w.welsh}</button>;
        })}
      </div>
      {wrongPick && <div className="tr-feedback tr-feedback--neutral" style={{ maxWidth: 460 }}>
        <span className="tr-feedback__dot"><Icon name="check" size={16} /></span>Almost — “{round.target.welsh}” is the one.
      </div>}
    </div>
  );
}

/* ============================================================ PLAY TOGETHER (hub) */
export function DinnerFamilyHub({ go, playDifferently }){
  const acts = [
    { id: 'say',   title: 'Say it together', desc: 'Record the family asking for more — then hear yourselves back.', color: 'coral',  icon: 'mic',  route: () => go('dinner-say') },
    { id: 'plate', title: 'Llond Bol',       desc: 'Pile food on a covered plate. Each turn, say the whole plate from memory — in Welsh — then add one more. How far can you get?', color: 'teal',   icon: 'fwd',  route: () => go('dinner-plate') },
    { id: 'cafe',  title: 'Bwrdd y Teulu',   desc: 'It’s dinner — and everyone’s hungry. Ask the table for what you want in Welsh, or it stays where it is.', color: 'indigo', icon: 'fwd',  route: () => go('dinner-cafe') },
  ];
  return (
    <div className="screen layerscreen">
      <TopBar title="Play together" onBack={() => go('dinner')} />
      <div className="screen__scroll layerscreen__scroll">
        <div className="layerscreen__head">
          <div className="layerscreen__kicker">Family activity · everyone around the screen</div>
          <div className="layerscreen__title">Amser chwarae</div>
        </div>
        {playDifferently && (
          <div className="tr-feedback tr-feedback--neutral" style={{ marginBottom: 16 }}>
            <span className="tr-feedback__dot"><Icon name="heart" size={16} /></span>
            Play differently is on — each activity offers a no-recording way to join in.
          </div>
        )}
        <div className="layers">
          {acts.map(a => (
            <button key={a.id} className="layer" onClick={a.route}>
              <span className="layer__num" style={{ background: `var(--tile-${a.color})`, color: 'var(--ink)' }}><Icon name={a.icon} size={22} /></span>
              <span className="layer__body">
                <span className="layer__title">{a.title}</span>
                <span className="layer__welsh">{a.desc}</span>
              </span>
              <span className="layer__right"><span className="topic-card__arrow">→</span></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ SAY IT TOGETHER */
export function DinnerSay({ go, mark, tweaks, playDifferently }){
  const phrase = DD.phraseById['phrase_ga_i_fwy_o_datws'];
  const [phase, setPhase] = useState(playDifferently ? 'alt' : 'ready');
  const [playingId, play] = useSimAudio();
  const cvar = { '--tile-c': `var(--tile-${phrase.color})` };
  const timers = useRef([]);
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function startRec(){ setPhase('rec'); after(2600, () => { setPhase('think'); after(600, () => setPhase('play')); }); }
  useEffect(() => { if (phase === 'play') after(1900, () => setPhase('done')); }, [phase === 'play']);
  function reset(){ timers.current.forEach(clearTimeout); setPhase('ready'); }
  function finish(){ mark('dinner', 'family'); go('dinner-family'); }

  return (
    <div className="fa" style={cvar}>
      <div className="fa__bar">
        <button className="fa__close" onClick={() => go('dinner-family')} aria-label="Close"><Icon name="close" /></button>
        <span className="fa__kicker">Family activity · Say it together</span>
      </div>
      <div className="fa__body">
        {phase === 'alt' ? (
          <>
            <span className="fa__phrase">{phrase.welsh}</span>
            <span className="fa__en">{phrase.natural}</span>
            <span className="fa__prompt">Point to what you want and nod — that counts too.</span>
            <div className="fa__actions">
              <button className="fa-btn fa-btn--ink" onClick={() => setPhase('ready')}><Icon name="mic" size={20} /> Use recording instead</button>
              <button className="fa-btn fa-btn--paper" onClick={finish}>We did it</button>
            </div>
          </>
        ) : phase === 'done' ? (
          <div className="fa__celebrate">
            <span className="fa__burst">Dyna chi! 🎉</span>
            <span className="fa__en" style={{ opacity: .9 }}>That’s your family, asking in Welsh.</span>
            <Waveform state={playingId === 'playback' ? 'play' : 'idle'} />
            <button className={`fa-playback${playingId === 'playback' ? ' is-playing' : ''}`} onClick={() => play('playback', 1900)}>
              <span className="fa-playback__icon"><Icon name={playingId === 'playback' ? 'sound' : 'play'} size={22} /></span>
              {playingId === 'playback' ? 'Playing your recording…' : 'Hear your recording'}
            </button>
            <div className="fa__actions">
              <button className="fa-btn fa-btn--ghost" onClick={reset}><Icon name="refresh" size={20} /> Do it again</button>
              <button className="fa-btn fa-btn--ink" onClick={finish}>Done →</button>
            </div>
          </div>
        ) : (
          <>
            <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
              <span className="fa__phrase fa__word--tap" role="button" tabIndex={0} aria-label={`Hear ${phrase.welsh}`} onClick={() => play('word')}>{phrase.welsh}</span>
              <span className="fa__en">{phrase.natural}</span>
              {phase === 'ready' && <button className="fa__hear" onClick={() => play('word')}><Icon name="sound" size={18} /> {playingId === 'word' ? 'Playing…' : 'Tap the phrase to hear it'}</button>}
            </div>
            {phase === 'ready' && <>
              <span className="fa__prompt">Everyone together?<br />Tap to record.</span>
              {tweaks.recordStyle === 'bar'
                ? <button className="rec-bar" onClick={startRec}><span className="rec-bar__dot" /> Tap to record</button>
                : <button className="rec" onClick={startRec}><span className="rec__icon" /><span className="rec__label">Record</span></button>}
            </>}
            {phase === 'rec' && <>
              <Waveform state="live" />
              {tweaks.recordStyle === 'bar'
                ? <button className="rec-bar is-rec" onClick={() => { timers.current.forEach(clearTimeout); setPhase('play'); }}><span className="rec-bar__dot" /> Listening… tap to stop</button>
                : <button className="rec is-rec" onClick={() => { timers.current.forEach(clearTimeout); setPhase('play'); }}><span className="rec__icon" /><span className="rec__label">Stop</span></button>}
            </>}
            {phase === 'think' && <p className="fa__prompt" style={{ opacity: .7 }}>One sec…</p>}
            {phase === 'play' && <><Waveform state="play" /><p className="fa__welsh">Playing your family back…</p></>}
          </>
        )}
      </div>
    </div>
  );
}
