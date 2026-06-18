'use client';
/* ============================================================
   Tirio — app root: router, state, tweaks
   ============================================================ */
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

import { Icon, Button, TopBar, speakText } from '@/components/primitives';
import { ViewportDebug } from '@/components/viewport-debug'; // TEMP: remove after viewport fix
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle,
} from '@/components/tweaks-panel';
import {
  Splash, Auth, Home, Alphabet, AccountSheet, WhoModal, LearnerPill,
} from '@/screens/shell';
import {
  LetterDetail, ParentReference, ParentSupplemental,
} from '@/screens/letter';
import {
  FamilyHub, FamilyRecord, WordBuilder, ChallengeDeck, ChallengeFull, ChallengeAway, ChallengeReturn,
} from '@/screens/family';
import {
  DinnerTopic, DinnerReference, DinnerSupplemental, DinnerFamilyHub, DinnerSay,
} from '@/screens/dinner';
import {
  PlateBuilder, CafeRoleplay, DinnerChallengeDeck, DinnerChallengeFull, DinnerChallengeAway, DinnerChallengeReturn,
} from '@/screens/dinner-games';

const TWEAK_DEFAULTS = {
  lotdStyle: 'hero',
  gridStyle: 'uniform',
  recordStyle: 'circle',
  tactile: 'medium',
  palette: 'system',
  dark: false,
  playDifferently: false,
};

const LS = 'tirio_state_v1';
function loadState(){
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(LS)) || {}; } catch(e){ return {}; }
}
function saveState(s){
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(LS, JSON.stringify(s)); } catch(e){}
}

/* ---- Account foundation: membership tiers + people on the account + tracking ---- */
const TIERS = {
  free:  { id: 'free',  label: 'Tirio Free',  maxMembers: 1, blurb: 'One family profile' },
  teulu: { id: 'teulu', label: 'Tirio Teulu', maxMembers: 6, blurb: 'Up to 6 people on the account' },
};
const MEMBER_COLORS = ['coral', 'teal', 'gold', 'indigo', 'orange'];
const DEFAULT_FAMILY = { tier: 'free', members: [] };
// Activities that record progress — entering one (on Teulu) asks "who's this?".
const TRACKED_ACTIVITY = new Set([
  'letter', 'reference', 'supplemental', 'family', 'family-record', 'wordbuilder',
  'challenge', 'challenge-full',
  'dinner-reference', 'dinner-supplemental', 'dinner-say', 'dinner-challenge', 'dinner-challenge-full',
]);

export default function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const persisted = useRef(loadState());
  const [eng, setEng] = useState(persisted.current.eng || {});
  const [flags, setFlags] = useState(persisted.current.flags || { arrangeDone: false });
  const [account, setAccount] = useState(persisted.current.account || null);
  const [lastLetter, setLastLetter] = useState(persisted.current.lastLetter || null);
  const [family, setFamily] = useState(persisted.current.family || DEFAULT_FAMILY);
  const [tracking, setTracking] = useState(persisted.current.tracking || { plays: {}, recent: [] });
  const [activeMember, setActiveMember] = useState(null); // session 'current learner' (Teulu): id | 'family' | null
  const activeMemberRef = useRef(null);
  useEffect(() => { activeMemberRef.current = activeMember; }, [activeMember]);
  const [sheet, setSheet] = useState(false);

  // simulated audio + Web Speech fallback (shared across screens that take play/playingId props)
  const [playingId, setPlayingId] = useState(null);
  const playTid = useRef(null);
  const play = useCallback((id, textOrMs?, audioPath?) => {
    clearTimeout(playTid.current);
    if (typeof textOrMs === 'string') {
      speakText(textOrMs, audioPath);
      setPlayingId(id);
      playTid.current = setTimeout(() => setPlayingId(null), 1800);
    } else {
      setPlayingId(id);
      playTid.current = setTimeout(() => setPlayingId(null), typeof textOrMs === 'number' ? textOrMs : 1200);
    }
  }, []);
  useEffect(() => () => {
    clearTimeout(playTid.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  // router
  const [stack, setStack] = useState([{ name: 'splash', params: {} }]);
  const [dir, setDir] = useState('fwd');
  const [navSeq, setNavSeq] = useState(0);
  const cur = stack[stack.length - 1];

  useEffect(() => { saveState({ eng, flags, account, lastLetter, family, tracking }); }, [eng, flags, account, lastLetter, family, tracking]);


  const go = useCallback((name, params = {}) => {
    setDir('fwd'); setNavSeq(s => s + 1);
    if (name === 'home') { setStack([{ name: 'home', params }]); return; }
    if (name === 'splash') { setStack([{ name: 'splash', params }]); return; }
    setStack(st => [...st, { name, params }]);
  }, []);
  const back = useCallback(() => {
    setDir('back'); setNavSeq(s => s + 1);
    setStack(st => st.length > 1 ? st.slice(0, -1) : st);
  }, []);

  const mark = useCallback((id, key) => {
    setEng(e => ({ ...e, [id]: { ...(e[id] || {}), [key]: true } }));
    setLastLetter(id);
    // attribute this bit of progress to whoever's learning right now (Teulu)
    const am = activeMemberRef.current;
    if (am && am !== 'family'){
      setTracking(t => { const by = t.byMember || {}; const cur = by[am] || {}; return { ...t, byMember: { ...by, [am]: { ...cur, lessons: (cur.lessons || 0) + 1, lastAt: Date.now() } } }; });
    }
  }, []);
  const setFlag = useCallback((k, v) => setFlags(f => ({ ...f, [k]: v })), []);

  // ---- account foundation helpers ----
  const addMember = useCallback((name) => {
    const nm = (name || '').trim(); if (!nm) return;
    setFamily(f => {
      if (f.members.some(m => m.name.toLowerCase() === nm.toLowerCase())) return f;
      const color = MEMBER_COLORS[f.members.length % MEMBER_COLORS.length];
      return { ...f, members: [...f.members, { id: 'p' + Date.now().toString(36), name: nm, color }] };
    });
  }, []);
  const removeMember = useCallback((id) => setFamily(f => ({ ...f, members: f.members.filter(m => m.id !== id) })), []);
  const setTier = useCallback((tier) => setFamily(f => ({ ...f, tier })), []);
  const trackPlay = useCallback((gameId, data = {}) => {
    setTracking(t => ({
      ...t,
      plays: { ...t.plays, [gameId]: (t.plays[gameId] || 0) + 1 },
      recent: [...(t.recent || []).slice(-29), { gameId, at: Date.now(), ...data }],
    }));
  }, []);
  // per-member progress (Teulu tier) — feeds the family leaderboard
  const trackMember = useCallback((id, delta = {}) => {
    if (!id) return;
    setTracking(t => {
      const by = t.byMember || {};
      const cur = by[id] || { turns: 0, correct: 0, wins: 0, games: 0 };
      return { ...t, byMember: { ...by, [id]: {
        turns: (cur.turns || 0) + (delta.turns || 0),
        correct: (cur.correct || 0) + (delta.correct || 0),
        wins: (cur.wins || 0) + (delta.wins || 0),
        games: (cur.games || 0) + (delta.games || 0),
        lessons: (cur.lessons || 0) + (delta.lessons || 0),
        lastAt: Date.now(),
      } } };
    });
  }, []);
  // solo practice sessions (parent supplemental) — account-level
  const trackPractice = useCallback((kind = 'dinner') => {
    setTracking(t => ({ ...t, practice: (t.practice || 0) + 1, practiceBy: { ...(t.practiceBy || {}), [kind]: ((t.practiceBy || {})[kind] || 0) + 1 } }));
  }, []);

  // a go() that uses back-animation when navigating to a screen already below in the stack
  function navBack(fromName){
    return (name, params) => {
      const below = stack[stack.length - 2];
      if (below && below.name === name) back();
      else go(name, params);
    };
  }

  // map route → element
  function render(){
    const p = cur.params || {};
    switch (cur.name){
      case 'splash':        return <Splash go={go} />;
      case 'auth':          return <Auth go={go} onAuth={(n) => { setAccount(n); go('home'); }} />;
      case 'forgot':        return <Forgot go={go} />;
      case 'home':          return <Home go={go} eng={eng} account={account} tweaks={t} lastLetter={lastLetter} openSheet={() => setSheet(true)} setFlag={setFlag} flags={flags} />;
      case 'alphabet':      return <Alphabet go={go} eng={eng} tweaks={t} />;
      case 'letter':        return <LetterDetail id={p.id} go={navBack('letter')} eng={eng} mark={mark} play={play} playingId={playingId} tweaks={t} />;
      case 'reference':     return <ParentReference id={p.id} go={navBack('reference')} eng={eng} mark={mark} play={play} playingId={playingId} />;
      case 'supplemental':  return <ParentSupplemental id={p.id} go={navBack('supplemental')} mark={mark} play={play} playingId={playingId} tweaks={t} />;
      case 'family':        return <FamilyHub id={p.id} go={navBack('family')} flags={flags} mark={mark} playDifferently={t.playDifferently} />;
      case 'family-record': return <FamilyRecord id={p.id} go={navBack('family-record')} mark={mark} tweaks={t} playDifferently={t.playDifferently} />;
      case 'wordbuilder':   return <WordBuilder id={p.id} variant={p.variant} go={navBack('wordbuilder')} mark={mark} setFlag={setFlag} flags={flags} />;
      case 'challenge':     return <ChallengeDeck id={p.id} go={navBack('challenge')} />;
      case 'challenge-full':return <ChallengeFull id={p.id} challenge={p.challenge} go={navBack('challenge-full')} mark={mark} />;
      case 'challenge-away':return <ChallengeAway id={p.id} challenge={p.challenge} go={navBack('challenge-away')} />;
      case 'challenge-return': return <ChallengeReturn id={p.id} challenge={p.challenge} go={navBack('challenge-return')} />;

      /* ---- Amser Bwyd (Dinner Time) ---- */
      case 'dinner':                 return <DinnerTopic go={navBack('dinner')} eng={eng} />;
      case 'dinner-reference':       return <DinnerReference go={navBack('dinner-reference')} eng={eng} mark={mark} />;
      case 'dinner-supplemental':    return <DinnerSupplemental go={navBack('dinner-supplemental')} mark={mark} trackPractice={trackPractice} />;
      case 'dinner-family':          return <DinnerFamilyHub go={navBack('dinner-family')} playDifferently={t.playDifferently} />;
      case 'dinner-say':             return <DinnerSay go={navBack('dinner-say')} mark={mark} tweaks={t} playDifferently={t.playDifferently} />;
      case 'dinner-plate':           return <PlateBuilder go={navBack('dinner-plate')} mark={mark} family={family} addMember={addMember} trackPlay={trackPlay} trackMember={trackMember} />;
      case 'dinner-cafe':            return <CafeRoleplay go={navBack('dinner-cafe')} mark={mark} family={family} addMember={addMember} trackPlay={trackPlay} trackMember={trackMember} />;
      case 'dinner-challenge':       return <DinnerChallengeDeck go={navBack('dinner-challenge')} mark={mark} />;
      case 'dinner-challenge-full':  return <DinnerChallengeFull challenge={p.challenge} go={navBack('dinner-challenge-full')} mark={mark} />;
      case 'dinner-challenge-away':  return <DinnerChallengeAway challenge={p.challenge} go={navBack('dinner-challenge-away')} />;
      case 'dinner-challenge-return':return <DinnerChallengeReturn challenge={p.challenge} go={navBack('dinner-challenge-return')} />;

      default:              return <Home go={go} eng={eng} account={account} tweaks={t} lastLetter={lastLetter} openSheet={() => setSheet(true)} />;
    }
  }

  const theme = t.dark ? 'dark' : 'light';
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Mirror the active screen's background onto the <body> canvas. With no
  // viewport-fit:cover, iOS paints the notch/safe-area regions with the body
  // background, so this makes them match the current screen edge-to-edge.
  const renderRef = useRef(null);
  useLayoutEffect(() => {
    const el = renderRef.current?.firstElementChild;
    if (!el) return;
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      document.body.style.backgroundColor = bg;
      try {
        let m = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
        if (!m) {
          m = document.createElement('meta');
          m.name = 'theme-color';
          document.head.appendChild(m);
        }
        m.content = bg;
      } catch (e) {
        // ignore DOM/security errors
      }
    }
  }, [navSeq, theme]);

  return (
    <div id="app-root" data-theme={theme} data-tactile={t.tactile} data-palette={t.palette}
      style={{ position: 'absolute', inset: 0, background: 'var(--surface-base)' }}>
      <div ref={renderRef} className={dir === 'back' ? 'rt-back-enter' : 'rt-enter'} key={navSeq} style={{ position: 'absolute', inset: 0 }}>
        {render()}
      </div>
      {sheet && <AccountSheet account={account} family={family} tiers={TIERS} tracking={tracking}
        addMember={addMember} removeMember={removeMember} setTier={setTier}
        onClose={() => setSheet(false)} tweaks={t} setTweak={setTweak} go={go}
        onSignOut={() => setAccount(null)} onSignIn={() => go('auth')} />}

      {family.tier === 'teulu' && family.members.length > 0 && TRACKED_ACTIVITY.has(cur.name) && (
        (activeMember && (activeMember === 'family' || family.members.some(m => m.id === activeMember)))
          ? <LearnerPill name={activeMember === 'family' ? 'Everyone' : family.members.find(m => m.id === activeMember).name}
              onSwitch={() => setActiveMember(null)} />
          : <WhoModal members={family.members} onPick={setActiveMember} />
      )}

      <TirioTweaks t={t} setTweak={setTweak} />
      <ViewportDebug />{/* TEMP: remove after viewport fix */}
    </div>
  );
}

/* simple forgot-password screen */
function Forgot({ go }){
  const [sent, setSent] = useState(false);
  return (
    <div className="screen auth">
      <TopBar onBack={() => go('auth')} />
      <div className="screen__scroll"><div className="auth__body">
        {sent ? (
          <>
            <div className="tr-feedback tr-feedback--success"><span className="tr-feedback__dot"><Icon name="check" size={16} /></span>
              Check your inbox — we've sent a reset link.</div>
            <Button kind="ink" size="lg" block onClick={() => go('auth')}>Back to sign in</Button>
          </>
        ) : (
          <>
            <div className="auth__head"><div className="auth__title">Reset password</div>
              <div className="auth__sub">We'll email you a link to set a new one.</div></div>
            <div className="tr-field"><label className="tr-field__label">Email</label><input className="tr-input" type="email" placeholder="you@example.com" /></div>
            <Button kind="primary" size="lg" block onClick={() => setSent(true)}>Send reset link</Button>
          </>
        )}
      </div></div>
    </div>
  );
}

/* ---------------- Tweaks panel ---------------- */
function TirioTweaks({ t, setTweak }){
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Direction to compare" />
      <TweakRadio label="Letter of the Day" value={t.lotdStyle} options={['hero', 'split', 'paper']} onChange={v => setTweak('lotdStyle', v)} />
      <TweakRadio label="Alphabet grid" value={t.gridStyle} options={['uniform', 'feature', 'row']} onChange={v => setTweak('gridStyle', v)} />
      <TweakRadio label="Record button" value={t.recordStyle} options={['circle', 'bar']} onChange={v => setTweak('recordStyle', v)} />

      <TweakSection label="Feel" />
      <TweakRadio label="Tactile tiles" value={t.tactile} options={['subtle', 'medium', 'bold']} onChange={v => setTweak('tactile', v)} />
      <TweakRadio label="Palette" value={t.palette} options={['system', 'modern']} onChange={v => setTweak('palette', v)} />
      <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak('dark', v)} />

      <TweakSection label="Accessibility" />
      <TweakToggle label="Play differently" value={t.playDifferently} onChange={v => setTweak('playDifferently', v)} />
    </TweaksPanel>
  );
}
