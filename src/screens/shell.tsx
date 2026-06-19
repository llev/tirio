'use client';
/* ============================================================
   Tirio — shell-register screens
   Splash · Auth · Home · Alphabet grid · Account sheet
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import D from '@/lib/data';
import DD from '@/lib/data-dinner';
import { Icon, Button, Tile, EngDots, TopBar, Wordmark, DotMark, Toggle } from '@/components/primitives';

/* ---- unfamiliar-letter priority + unlock constants ---- */
export const UNLOCK_THRESHOLD = Math.floor(D.letters.length * 0.33); // 9 of 29

/* priority order: most unfamiliar to English speakers first */
const PRIORITY_IDS = ['letter_ll','letter_ch','letter_rh','letter_dd','letter_ng','letter_ph','letter_ff','letter_th','letter_r','letter_f','letter_w','letter_y','letter_u'];

export function letterChip(l){
  if (['letter_dd','letter_ng','letter_ph'].includes(l.id))          return { label:'Sneaky!',          kind:'sneaky' };
  if (['letter_ch','letter_ll','letter_rh'].includes(l.id))          return { label:'New sound',        kind:'new'    };
  if (['letter_f','letter_r','letter_w','letter_y'].includes(l.id))  return { label:'Sounds different', kind:'diff'   };
  return null;
}

/* small helpers */
export function layerCount(eng, id){ const e = eng[id]; return e ? (e.reference?1:0)+(e.supplemental?1:0)+(e.family?1:0)+(e.challenge?1:0) : 0; }
function dayNum(){ const now=new Date(); return Math.floor((now-new Date(now.getFullYear(),0,0))/86400000); }
export function dinnerIsUnlocked(eng){ return D.letters.filter(l=>layerCount(eng,l.id)>0).length >= UNLOCK_THRESHOLD; }
export function dayPick(){
  const p = D.letters.filter(l=>PRIORITY_IDS.includes(l.id)).sort((a,b)=>PRIORITY_IDS.indexOf(a.id)-PRIORITY_IDS.indexOf(b.id));
  const rest = D.letters.filter(l=>!PRIORITY_IDS.includes(l.id));
  return [...p,...rest][dayNum() % D.letters.length];
}

/* ============================================================ SPLASH */
export function Splash({ go }) {
  return (
    <div className="splash">
      <div className="splash__mark">
        <div className="splash__tile"><b>t</b></div>
        <div className="splash__name">tirio</div>
      </div>
      <div className="splash__promise">A little Welsh, together, every day.</div>
      <div className="splash__paths">
        <Button kind="primary" size="lg" block onClick={() => go('home', { fresh: true })}>Explore first</Button>
        <Button kind="ghost" size="lg" block onClick={() => go('auth')}>Sign in</Button>
      </div>
    </div>
  );
}

/* ============================================================ AUTH */
export function Auth({ go, onAuth }) {
  const [mode, setMode] = useState('in'); // in | up
  const [err, setErr] = useState(false);
  return (
    <div className="screen auth">
      <TopBar onBack={() => go('splash')} />
      <div className="screen__scroll">
        <div className="auth__body">
          <div className="auth__head">
            <div className="auth__title">{mode === 'in' ? 'Croeso back' : 'Start exploring'}</div>
            <div className="auth__sub">{mode === 'in' ? 'Sign in to pick up where your family left off.' : "Save your family's progress as you go."}</div>
          </div>

          <button className="auth__google" onClick={() => onAuth('Enw')}>
            <GoogleG /> Continue with Google
          </button>

          <div className="auth__divider">or with email</div>

          <div className="auth__form">
            {mode === 'up' && (
              <div className="tr-field"><label className="tr-field__label">Your name</label>
                <input className="tr-input" placeholder="e.g. Enw" /></div>
            )}
            <div className="tr-field"><label className="tr-field__label">Email</label>
              <input className="tr-input" type="email" placeholder="you@example.com" /></div>
            <div className={`tr-field${err ? ' tr-field--error' : ''}`}><label className="tr-field__label">Password</label>
              <input className="tr-input" type="password" placeholder="••••••••" onChange={() => setErr(false)} />
              {err && <span className="tr-field__hint">That email and password don't match. Try again or reset your password.</span>}</div>
            {mode === 'in' && <button className="auth__link" onClick={() => go('forgot')}>Forgot your password?</button>}
            <Button kind="ink" size="lg" block onClick={() => onAuth('Enw')}>
              {mode === 'in' ? 'Sign in' : 'Create account'}
            </Button>
          </div>

          <div className="auth__alt">
            {mode === 'in'
              ? <>New here? <button onClick={() => setMode('up')}>Create an account</button></>
              : <>Already have an account? <button onClick={() => setMode('in')}>Sign in</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}
function GoogleG() {
  return (<svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5C43.5 37.5 46.1 31.6 46.1 24.5z"/><path fill="#FBBC05" d="M10.5 28.3c-.5-1.4-.7-2.9-.7-4.3s.3-3 .7-4.3l-7.9-6.1C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.1-5.5c-2 1.3-4.6 2.1-8.2 2.1-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>);
}

/* ============================================================ HOME */
export function Home({ go, eng, account, tweaks, openSheet, lastLetter, setFlag, flags }) {
  const [scrolled, setScrolled] = useState(false);
  // Lazy init: if dinner unlocked while Home was unmounted, show confetti once.
  const [showUnlock, setShowUnlock] = useState(
    () => !flags.dinnerUnlockNotified && dinnerIsUnlocked(eng)
  );
  const prevUnlockedRef = useRef(dinnerIsUnlocked(eng));
  const cont = lastLetter ? D.letters.find(l => l.id === lastLetter) : null;
  const totalMarks = D.letters.reduce((a, l) => a + layerCount(eng, l.id), 0);
  const engaged = D.letters.filter(l => layerCount(eng, l.id) > 0).length;
  const dinnerMarks = layerCount(eng, 'dinner');
  const dinnerUnlocked = dinnerIsUnlocked(eng);
  const exploredCount = D.letters.filter(l => layerCount(eng, l.id) > 0).length;

  // Mark notified the moment confetti first shows (mount-time unlock)
  useEffect(() => {
    if (showUnlock) { setFlag('dinnerUnlocked', true); setFlag('dinnerUnlockNotified', true); }
  }, []);

  // Catch the live transition (user stays on Home somehow while eng ticks over)
  useEffect(() => {
    const now = dinnerIsUnlocked(eng);
    if (!prevUnlockedRef.current && now && !flags.dinnerUnlockNotified) {
      setFlag('dinnerUnlocked', true); setFlag('dinnerUnlockNotified', true); setShowUnlock(true);
    }
    prevUnlockedRef.current = now;
  }, [eng]);

  return (
    <div className="screen home">
      <div className="topbar" style={scrolled ? { boxShadow: '0 1px 0 var(--border-subtle)' } : null}>
        <Wordmark />
        <div className="topbar__spacer" />
        <button className="avatar" onClick={openSheet} aria-label="Account">
          {account ? account[0].toUpperCase() : <Icon name="back" size={0} />}
          {!account && <span style={{ fontSize: 17 }}>?</span>}
        </button>
      </div>
      <div className="screen__scroll home__scroll" onScroll={e => setScrolled(e.target.scrollTop > 6)}>
        <div className="home__greet">{account ? `Helo, ${account}.` : "Helo. Here's a little Welsh for today."}</div>

        {!account && (
          <div className="nudge" style={{ marginBottom: 'var(--space-lg)' }}>
            <DotMark />
            <span className="nudge__txt">Sign in to save your progress<small>Nothing's lost — your family's play stays with you.</small></span>
            <Button kind="ink" onClick={() => go('auth')}>Sign in</Button>
          </div>
        )}

        <FeaturedSection style={tweaks.lotdStyle} cont={cont} eng={eng} go={go} dinnerUnlocked={dinnerUnlocked} />

        <div className="home__section-label">
          <h2>Topics</h2><span className="en">{engaged} of 29 letters explored</span>
        </div>
        <button className="topic-card" onClick={() => go('alphabet')}>
          <span className="topic-card__mini">
            {D.letters.slice(0, 9).map(l => <i key={l.id} style={{ background: `var(--tile-${l.color})` }} />)}
          </span>
          <span className="topic-card__body">
            <span className="topic-card__title">Yr Wyddor</span>
            <span className="topic-card__sub">The Welsh Alphabet · 29 letters</span>
            <span className="topic-card__engage">
              <span className="bar"><i style={{ width: `${Math.min(100, (totalMarks / (29 * 4)) * 100)}%` }} /></span>
              <span className="n">{totalMarks > 0 ? 'in play' : 'ready'}</span>
            </span>
          </span>
          <span className="topic-card__arrow">→</span>
        </button>

        {dinnerUnlocked ? (
          <button className="topic-card" onClick={() => go('dinner')} style={{ marginTop: 'var(--space-md)' }}>
            <span className="topic-card__mini topic-card__mini--art">
              <img src="/art/plat.svg" alt="" draggable="false" />
            </span>
            <span className="topic-card__body">
              <span className="topic-card__title">Amser Bwyd</span>
              <span className="topic-card__sub">Dinner Time · 17 words · 8 phrases</span>
              <span className="topic-card__engage">
                <span className="bar"><i style={{ width: `${(dinnerMarks / 4) * 100}%` }} /></span>
                <span className="n">{dinnerMarks > 0 ? `${dinnerMarks} of 4 explored` : 'new'}</span>
              </span>
            </span>
            <span className="topic-card__arrow">→</span>
          </button>
        ) : (
          <div className="topic-card topic-card--locked" style={{ marginTop: 'var(--space-md)' }}>
            <span className="topic-card__mini">
              {['coral', 'gold', 'teal', 'orange', 'indigo', 'coral', 'teal', 'gold', 'orange'].map((c, i) => <i key={i} style={{ background: `var(--tile-${c})`, opacity: 0.35 }} />)}
            </span>
            <span className="topic-card__body">
              <span className="topic-card__title">Amser Bwyd <span className="topic-card__lock-badge">🔒</span></span>
              <span className="topic-card__sub">Dinner Time · unlocks at 33% of Yr Wyddor</span>
              <span className="topic-card__engage">
                <span className="bar"><i style={{ width: `${Math.min(100,(exploredCount/UNLOCK_THRESHOLD)*100)}%`, background: 'var(--tile-gold)' }} /></span>
                <span className="n">{exploredCount} of {UNLOCK_THRESHOLD} letters to unlock</span>
              </span>
            </span>
          </div>
        )}

        <div className="soon-grid">
          {['Rhifau / Numbers', 'Lliwiau / Colours', 'Y Traeth / The Beach', 'Y Tywydd / Weather'].map(s => (
            <div className="soon" key={s}>
              <span className="soon__name">{s.split(' / ')[0]}</span>
              <span className="soon__tag">Coming soon</span>
            </div>
          ))}
        </div>
      </div>
      {showUnlock && <UnlockNotification onClose={() => setShowUnlock(false)} go={go} />}
    </div>
  );
}

function LetterOfTheDay({ style, letter, isContinue, go }) {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const w = letter.words ? letter.words[0] : (letter.examples ? { welsh: letter.examples[0].welsh, english: letter.examples[0].english } : { welsh: '', english: '' });
  const cta = isContinue ? `Continue with ${letter.letter}` : 'Play with this today';
  const kicker = isContinue ? 'Pick up where you left off' : 'Llythyren y dydd · Letter of the day';
  const chip = !isContinue ? letterChip(letter) : null;

  if (style === 'split') {
    return (
      <button className="lotd lotd--split" style={{ '--tile-c': `var(--tile-${letter.color})` }} onClick={() => go('letter', { id: letter.id })}>
        <span className="lotd__tile"><b>{letter.letter}</b></span>
        <span className="lotd__meta">
          <span className="lotd__kicker">{kicker}</span>
          {chip && <span className={`lotd__chip lotd__chip--${chip.kind}`}>{chip.label}</span>}
          <span className="lotd__word">{w.welsh}</span>
          <span className="lotd__en">{w.english}</span>
          <span className="lotd__cta">{cta} <span>→</span></span>
        </span>
      </button>
    );
  }
  if (style === 'paper') {
    return (
      <button className="lotd lotd--paper" style={{ '--tile-c': `var(--tile-${letter.color})` }} onClick={() => go('letter', { id: letter.id })}>
        <span className="lotd__rule">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Yr Wyddor Daily</span>
          <span className="lotd__date">{dateStr}</span>
        </span>
        <span className="lotd__row">
          <span className="lotd__big">{letter.letter}</span>
          <span className="lotd__meta">
            <span className="lotd__kicker" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>{kicker}</span>
            {chip && <span className={`lotd__chip lotd__chip--${chip.kind}`} style={{ display: 'inline-block', marginBottom: 6 }}>{chip.label}</span>}
            <span className="lotd__word">{w.welsh}</span>
            <span className="lotd__en">{w.english}</span>
            <span className="lotd__cta">{cta} <span>→</span></span>
          </span>
        </span>
      </button>
    );
  }
  // hero (default)
  return (
    <button className="lotd lotd--hero" style={{ '--tile-c': `var(--tile-${letter.color})` }} onClick={() => go('letter', { id: letter.id })}>
      {isContinue && <span className="lotd__continue">in progress</span>}
      <span className="lotd__kicker">{kicker}</span>
      {chip && <span className={`lotd__chip lotd__chip--${chip.kind}`}>{chip.label}</span>}
      <span className="lotd__big">{letter.letter}</span>
      <span className="lotd__word">{w.welsh}</span>
      <span className="lotd__en">{w.english}</span>
      <span className="lotd__cta">{cta} <span>→</span></span>
    </button>
  );
}

/* ============================================================ ALPHABET GRID */
export function Alphabet({ go, eng, tweaks }) {
  const [showIntro, setShowIntro] = useState(true);
  const suggested = dayPick();
  const style = tweaks.gridStyle;

  const tileFor = (l, key) => (
    <SuggestableTile key={key} l={l} eng={eng} suggested={l.id === suggested.id} go={go} />
  );

  return (
    <div className="screen alpha">
      <TopBar title="Yr Wyddor" onBack={() => go('home')} right={<span className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>29</span>} />
      <div className="screen__scroll alpha__scroll">
        {showIntro && (
          <div className="alpha__intro">
            <DotMark />
            <p><strong>Seven of these are sneaky.</strong> Dd, Ff, Ng, Ll, Ph, Rh and Th are single letters in Welsh — they just look like two. Tap any to meet it.
              <br /><button onClick={() => setShowIntro(false)}>Got it</button></p>
            <button className="x" onClick={() => setShowIntro(false)} aria-label="Dismiss">×</button>
          </div>
        )}

        {style === 'feature' && (
          <>
            <div className="alpha-feature">
              <FeatureTile l={suggested} eng={eng} go={go} />
            </div>
            <div className="alpha-rowlabel">All letters</div>
            <div className="alpha-grid alpha-grid--rest">
              {D.letters.filter(l => l.id !== suggested.id).map(l => tileFor(l, l.id))}
            </div>
          </>
        )}

        {style === 'row' && (
          <>
            <div className="alpha-rowlabel">Suggested today</div>
            <div className="alpha-row" style={{ marginBottom: 8 }}>
              <div className="tilewrap" style={{ width: 200 }}>{tileFor(suggested, 'sug')}</div>
            </div>
            <div className="alpha-rowlabel">A → Y · swipe across</div>
            <div className="alpha-row">
              {D.letters.map(l => <div className="tilewrap" key={l.id}>{tileFor(l, l.id)}</div>)}
            </div>
          </>
        )}

        {(!style || style === 'uniform') && (
          <div className="alpha-grid alpha-grid--g5">
            {D.letters.map(l => tileFor(l, l.id))}
          </div>
        )}

        {/* topic-level games: any random word, skip freely */}
        <div className="alpha-rowlabel" style={{ marginTop: 30 }}>Play with any word</div>
        <div className="layers">
          <button className="layer" onClick={() => go('wordbuilder', {})}>
            <span className="layer__num" style={{ background: 'var(--tile-teal)', color: 'var(--ink)' }}><Icon name="fwd" size={22} /></span>
            <span className="layer__body">
              <span className="layer__title">Build a word</span>
              <span className="layer__welsh">A random Welsh word — put the letters in order. Skip to another any time.</span>
            </span>
            <span className="layer__right"><span className="topic-card__arrow">→</span></span>
          </button>
          <button className="layer" onClick={() => go('family-record', {})}>
            <span className="layer__num" style={{ background: 'var(--tile-coral)', color: 'var(--ink)' }}><Icon name="mic" size={22} /></span>
            <span className="layer__body">
              <span className="layer__title">Say it together</span>
              <span className="layer__welsh">Record the family saying a random word, then hear yourselves back. Skip whenever.</span>
            </span>
            <span className="layer__right"><span className="topic-card__arrow">→</span></span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestableTile({ l, eng, suggested, go }) {
  const marks = layerCount(eng, l.id);
  return (
    <div className={`tilewrap${suggested ? ' tile-suggest' : ''}`}>
      {suggested && <span className="tile-suggest__flag">Today</span>}
      <Tile letter={l.letter} color={l.color} layers={marks} sneaky={l.sneaky}
        onClick={() => go('letter', { id: l.id })} ariaLabel={`${l.letter}${l.sneaky ? ', a sneaky sound' : ''}`} />
    </div>
  );
}
function FeatureTile({ l, eng, go }) {
  const w = l.words ? l.words[0] : { welsh: l.examples[0].welsh };
  return (
    <button className={`tr-tile tr-tile--c-${l.color}${l.digraph ? ' tr-tile--digraph' : ''}`} style={{ '--tile-c': `var(--tile-${l.color})` }}
      onClick={() => go('letter', { id: l.id })}>
      <span className="tr-tile__letter">{l.letter}</span>
      <span className="alpha-feature__meta">
        <span className="k">Suggested today</span>
        <span className="w">{w.welsh}</span>
      </span>
    </button>
  );
}

/* ============================================================ ACCOUNT SHEET */
/* ---- Active-learner gate (Teulu): asks "who's this?" on tracked activities ---- */
export function WhoModal({ members, onPick }){
  return (
    <div className="who-scrim">
      <div className="who">
        <div className="who__title">Who's learning?</div>
        <div className="who__sub">So we can keep each person's progress. You can switch any time.</div>
        <div className="who__people">
          {members.map(m => (
            <button key={m.id} className="who__person" style={{ '--mc': `var(--tile-${m.color})` }} onClick={() => onPick(m.id)}>
              <span className="who__avatar">{m.name[0].toUpperCase()}</span>{m.name}
            </button>
          ))}
          <button className="who__person who__person--all" onClick={() => onPick('family')}>
            <span className="who__avatar who__avatar--all"><DotMark /></span>Everyone
          </button>
        </div>
      </div>
    </div>
  );
}
export function LearnerPill({ name, onSwitch }){
  return (
    <button className="learner-pill" onClick={onSwitch} aria-label={`Learning as ${name} — tap to switch`}>
      <span className="learner-pill__av">{name[0].toUpperCase()}</span>
      <span className="learner-pill__name">{name}</span>
      <span className="learner-pill__switch">switch</span>
    </button>
  );
}

export function AccountSheet({ account, family, tiers, tracking, addMember, removeMember, setTier, onClose, tweaks, setTweak, go, onSignOut, onSignIn }) {
  const [newName, setNewName] = useState('');
  const fam = family || { tier: 'free', members: [] };
  const T = tiers || { free: { label: 'Tirio Free', maxMembers: 1 }, teulu: { label: 'Tirio Teulu', maxMembers: 6 } };
  const tier = T[fam.tier] || T.free;
  const atLimit = fam.members.length >= tier.maxMembers;
  const totalPlays = tracking ? Object.values(tracking.plays || {}).reduce((a, b) => a + b, 0) : 0;
  const board = (fam.members || [])
    .map(m => { const s = (((tracking && tracking.byMember) || {})[m.id]) || {}; return { ...m, turns: s.turns || 0, correct: s.correct || 0, wins: s.wins || 0, games: s.games || 0, lessons: s.lessons || 0 }; })
    .sort((a, b) => b.wins - a.wins || b.correct - a.correct || b.turns - a.turns || b.lessons - a.lessons);
  const anyStats = board.some(m => m.turns || m.wins || m.correct || m.lessons);
  const practice = (tracking && tracking.practice) || 0;
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet__grip" />
        {account ? (
          <div className="sheet__id">
            <span className="avatar" style={{ pointerEvents: 'none' }}>{account[0].toUpperCase()}</span>
            <span><div className="sheet__name">{account}</div><div className="sheet__email">{account.toLowerCase()}@example.com</div></span>
          </div>
        ) : (
          <div className="nudge" style={{ marginBottom: 'var(--space-md)' }}>
            <DotMark />
            <span className="nudge__txt">Save your progress<small>Sign in with Google or email.</small></span>
            <Button kind="ink" onClick={() => { onClose(); go('auth'); }}>Sign in</Button>
          </div>
        )}

        {/* ---- Account foundation: plan + the people who play together ---- */}
        <div className="fam">
          <div className="fam__head">
            <span className="fam__title">Your family</span>
            <div className="fam__plan" role="group" aria-label="Plan">
              <button className={`fam__tier${fam.tier === 'free' ? ' on' : ''}`} onClick={() => setTier && setTier('free')}>Free</button>
              <button className={`fam__tier${fam.tier === 'teulu' ? ' on' : ''}`} onClick={() => setTier && setTier('teulu')}>Teulu</button>
            </div>
          </div>

          {fam.tier === 'teulu' ? (
            <>
              <div className="fam__sub">{tier.label} · {fam.members.length}/{tier.maxMembers} people{totalPlays ? ` · ${totalPlays} games` : ''}{practice ? ` · ${practice} practice` : ''}</div>
              {fam.members.length > 0 ? (
                <div className="fam__members">
                  {fam.members.map(m => (
                    <span key={m.id} className="fam__chip" style={{ '--mc': `var(--tile-${m.color})` }}>
                      {m.name}
                      <button onClick={() => removeMember(m.id)} aria-label={`Remove ${m.name}`}>×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="fam__empty">Add the people who play together — turn-taking games pass round to each of them by name.</div>
              )}
              {atLimit
                ? <div className="fam__limit">You're at the Teulu limit of {tier.maxMembers}.</div>
                : (
                  <form className="fam__add" onSubmit={e => { e.preventDefault(); addMember(newName); setNewName(''); }}>
                    <input className="tr-input" placeholder="Add a name (e.g. Mabli)" value={newName} onChange={e => setNewName(e.target.value)} />
                    <Button kind="ink" type="submit">Add</Button>
                  </form>
                )}
              {fam.members.length > 0 && (
                <div className="board">
                  <div className="board__head">Leaderboard</div>
                  {anyStats ? (
                    <>
                      <div className="board__cols"><span /><span /><span>Wins</span><span>Right</span><span>Turns</span><span>Done</span></div>
                      <ol className="board__list">
                        {board.map((m, i) => (
                          <li key={m.id} className="board__row">
                            <span className={`board__rank${i === 0 ? ' lead' : ''}`}>{i + 1}</span>
                            <span className="board__name" style={{ '--mc': `var(--tile-${m.color})` }}>{m.name}</span>
                            <span className="board__num board__num--win">{m.wins}</span>
                            <span className="board__num board__num--right">{m.correct}</span>
                            <span className="board__num">{m.turns}</span>
                            <span className="board__num board__num--done">{m.lessons}</span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <div className="fam__empty">Play a turn-taking game together — wins, right-first-time and turns show up here.</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="fam__sub">{tier.label} · one shared profile{totalPlays ? ` · ${totalPlays} games` : ''}{practice ? ` · ${practice} practice` : ''}</div>
              <div className="fam__empty">On Free, your family plays as one shared profile. <b>Tirio Teulu</b> gives everyone their own name and their own turn in family games.</div>
              {fam.members.length > 0 && (
                <div className="fam__saved">
                  <span className="fam__saved-label">Saved for Teulu · {fam.members.length}</span>
                  <div className="fam__members fam__members--locked">
                    {fam.members.map(m => <span key={m.id} className="fam__chip" style={{ '--mc': `var(--tile-${m.color})` }}>{m.name}</span>)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sheet__row">
          <span>Dark mode</span>
          <Toggle on={tweaks.dark} onClick={() => setTweak('dark', !tweaks.dark)} label="Dark mode" />
        </div>
        <div className="sheet__row">
          <span>Play differently<br /><small className="muted" style={{ fontSize: 13 }}>Activities adapt for your family — no recording needed.</small></span>
          <Toggle on={tweaks.playDifferently} onClick={() => setTweak('playDifferently', !tweaks.playDifferently)} label="Play differently" />
        </div>
        <button className="sheet__link">Visit the website <Icon name="fwd" size={18} /></button>
        {account && <button className="sheet__link danger" onClick={() => { onSignOut(); onClose(); }}>Sign out</button>}
      </div>
    </div>
  );
}

/* ============================================================ FEATURED SECTION (rotates daily after dinner unlocks) */
export function FeaturedSection({ style, cont, go, dinnerUnlocked }) {
  const letter = cont || dayPick();
  if (!dinnerUnlocked) return <LetterOfTheDay style={style} letter={letter} isContinue={!!cont} go={go} />;
  const day = dayNum();
  const type = ['letter','word','phrase','game'][day % 4];
  if (type === 'letter') return <LetterOfTheDay style={style} letter={letter} isContinue={!!cont} go={go} />;
  if (type === 'word')   return <WordOfTheDay day={day} go={go} />;
  if (type === 'phrase') return <PhraseOfTheDay day={day} go={go} />;
  return <GameOfTheDay day={day} go={go} />;
}

/* ---- Word of the day ---- */
export function WordOfTheDay({ day, go }) {
  const dd = DD;
  const alphaWords = D.letters.flatMap(l => (l.words || []).map(w => ({ ...w, _color: l.color, _lid: l.id })));
  const dinnerWords = (dd ? dd.allWords : []).map(w => ({ ...w, _color: w.color, _dinner: true }));
  const pool = [...alphaWords, ...dinnerWords];
  const word = pool[day % pool.length];
  const color = word._color || 'teal';
  function nav(){ word._dinner ? go('dinner-reference') : go('letter', { id: word._lid }); }
  return (
    <button className="lotd lotd--wotd" style={{ '--tile-c': `var(--tile-${color})` }} onClick={nav}>
      <span className="lotd__kicker">Gair y dydd · Word of the day</span>
      {word.art && <img className="lotd__wotd-art" src={word.art} alt="" draggable="false" />}
      <span className="lotd__big">{word.welsh}</span>
      <span className="lotd__word">{word.english}</span>
      {word.pron && <span className="lotd__en">{word.pron}</span>}
      <span className="lotd__cta">Explore this word <span>→</span></span>
    </button>
  );
}

/* ---- Phrase of the day ---- */
export function PhraseOfTheDay({ day, go }) {
  const dd = DD;
  const phrase = dd.phrases[day % dd.phrases.length];
  return (
    <button className="lotd lotd--potd" style={{ '--tile-c': `var(--tile-${phrase.color})` }} onClick={() => go('dinner-reference')}>
      <span className="lotd__kicker">Ymadrodd y dydd · Phrase of the day</span>
      <span className="lotd__big lotd__big--phrase">{phrase.welsh}</span>
      <span className="lotd__word">{phrase.english}</span>
      {phrase.pron && <span className="lotd__en">{phrase.pron}</span>}
      <span className="lotd__cta">Explore Amser Bwyd <span>→</span></span>
    </button>
  );
}

/* ---- Game of the day ---- */
const DAILY_GAMES = [
  { title:'Listen & Find',       welsh:'Gwrando a darganfod', desc:'Hear a Welsh word — which one is it?',              color:'teal',   route:go=>go('supplemental',{id:D.letters[dayNum()%D.letters.length].id}) },
  { title:'Build a word',        welsh:'Adeiladu gair',       desc:'Put the letters in order to spell it.',            color:'gold',   route:go=>go('wordbuilder',{}) },
  { title:'Say it together',     welsh:"Dweud gyda'ch gilydd",desc:'Record your family saying a Welsh word.',          color:'coral',  route:go=>go('family-record',{}) },
  { title:'Build a plate',       welsh:'Adeiladu plât',       desc:'Drag dinner words onto the plate in Welsh.',       color:'indigo', route:go=>go('dinner-plate') },
  { title:'Café Cymraeg',        welsh:'Caffi Cymraeg',       desc:'Take orders in Welsh at the family café.',         color:'orange', route:go=>go('dinner-cafe') },
  { title:'Dinner challenges',   welsh:'Her Amser Bwyd',      desc:'Family challenges to try at your next meal.',     color:'coral',  route:go=>go('dinner-challenge') },
  { title:'Alphabet challenges', welsh:'Her yr Wyddor',       desc:'No screen needed — just your family.',           color:'indigo', route:go=>go('challenge',{}) },
  { title:'Say it at dinner',    welsh:'Dweud hi wrth fwyta', desc:'Record your family saying dinner phrases.',       color:'teal',   route:go=>go('dinner-say') },
];
export function GameOfTheDay({ day, go }) {
  const game = DAILY_GAMES[day % DAILY_GAMES.length];
  return (
    <button className="lotd lotd--gotd" style={{ '--tile-c': `var(--tile-${game.color})` }} onClick={() => game.route(go)}>
      <span className="lotd__kicker">Gêm y dydd · Game of the day</span>
      <span className="lotd__big lotd__big--game">{game.title}</span>
      <span className="lotd__word">{game.welsh}</span>
      <span className="lotd__en">{game.desc}</span>
      <span className="lotd__cta">Play now <span>→</span></span>
    </button>
  );
}

/* ============================================================ UNLOCK NOTIFICATION (confetti) */
export function UnlockNotification({ onClose, go }) {
  const COLORS = ['var(--tile-coral)','var(--tile-gold)','var(--tile-teal)','var(--tile-indigo)','var(--tile-orange)'];
  const pieces = useRef(Array.from({ length: 58 }, (_, i) => ({
    x: Math.random() * 100, rot: Math.random() * 720,
    delay: Math.random() * 0.7, color: COLORS[i % COLORS.length],
    size: 7 + Math.random() * 9, wide: Math.random() > 0.5,
    dx: (Math.random() - 0.5) * 160,
  }))).current;
  return (
    <div className="unlock-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="unlock-confetti" aria-hidden="true">
        {pieces.map((p, i) => (
          <span key={i} className="confetti-piece" style={{
            left: `${p.x}%`, '--rot': `${p.rot}deg`, '--dx': `${p.dx}px`, animationDelay: `${p.delay}s`,
            background: p.color, width: p.wide ? `${p.size * 1.8}px` : `${p.size}px`,
            height: `${p.size}px`, borderRadius: p.wide ? '2px' : '50%',
          }} />
        ))}
      </div>
      <div className="unlock-card" onClick={e => e.stopPropagation()}>
        <div className="unlock-card__emoji" aria-hidden="true">🍽️</div>
        <h2 className="unlock-card__title">Amser Bwyd</h2>
        <p className="unlock-card__sub">Dinner Time is now unlocked!</p>
        <p className="unlock-card__desc">You've explored a third of the Welsh alphabet. Time to bring Welsh to the dinner table.</p>
        <div className="unlock-card__actions">
          <button className="unlock-card__cta" onClick={() => { onClose(); go('dinner'); }}>Explore now →</button>
          <button className="unlock-card__later" onClick={onClose}>Later</button>
        </div>
      </div>
    </div>
  );
}
