'use client';
/* ============================================================
   Tirio — Amser Bwyd · speech-gated family games
   PlateBuilder  → "Llond Plât"  (route: dinner-plate)
   CafeRoleplay  → "Caffi Cudd"  (route: dinner-cafe)
   DinnerChallenge Deck / Full / Away / Return
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import { Icon, Button, DotMark, TopBar, useSimAudio } from '@/components/primitives';
import { DD, dShuffle } from '@/screens/dinner';

/* plate seat positions (fractions of plate box, centre-relative) */
const LP_SEATS = [
  { x: 0.50, y: 0.32 }, { x: 0.32, y: 0.55 }, { x: 0.68, y: 0.55 },
  { x: 0.50, y: 0.74 },
];

function pickN(arr, n, exclude = []){
  const pool = dShuffle(arr.filter(x => !exclude.includes(x)));
  return pool.slice(0, n);
}

/* small role band naming the two seats — Welsh role + English gloss */
function RoleBand({ leftWelsh, leftGloss, rightWelsh, rightGloss, activeSide }){
  return (
    <div className="roleband">
      <div className={`roleband__role${activeSide === 'L' ? ' is-active' : ''}`}>
        <span className="roleband__name">{leftWelsh}</span><small>{leftGloss}</small>
      </div>
      <span className="roleband__arrow">·</span>
      <div className={`roleband__role${activeSide === 'R' ? ' is-active' : ''}`}>
        <span className="roleband__name">{rightWelsh}</span><small>{rightGloss}</small>
      </div>
    </div>
  );
}

/* verdict phrases — verified content (challenge_taste_test, data-dinner) */
const LP_VERDICTS = [
  { id: 'like',    welsh: "Dw i'n hoffi hwn!",        en: 'I like this!' },
  { id: 'dislike', welsh: "Dw i ddim yn hoffi hwn!",  en: "I don't like this!" },
];

/* Shared "who's playing" setup — Free = anonymous seats (2–5); Teulu = named members. */
function PlayerSetup({ family, addMember, title, blurb, startLabel, onStart }){
  const isTeulu = !!(family && family.tier === 'teulu');
  const members = isTeulu ? (family.members || []) : [];
  const [selected, setSelected] = useState(members.map(m => m.id));
  const [count, setCount] = useState(3);
  const [newName, setNewName] = useState('');
  useEffect(() => { setSelected(members.map(m => m.id)); }, [members.length, isTeulu]);
  const namedSel = members.filter(m => selected.includes(m.id)).map(m => m.name);
  function toggle(id){ setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  function start(){
    const r = namedSel.length >= 2 ? namedSel : Array.from({ length: count }, (_, i) => 'Player ' + (i + 1));
    onStart(r);
  }
  return (
    <div className="sg__body lb-setup">
      <div className="sayprompt">
        <span className="sayprompt__lead">{title}</span>
        <span className="sayprompt__big">Who’s playing?</span>
        <span className="sayprompt__sub">{blurb}</span>
      </div>

      {isTeulu && members.length > 0 && (
        <div className="lb-roster">
          {members.map(m => (
            <button key={m.id} className={'lb-name' + (selected.includes(m.id) ? ' on' : '')} style={{ '--mc': 'var(--tile-' + m.color + ')' }} onClick={() => toggle(m.id)}>{m.name}</button>
          ))}
        </div>
      )}

      {isTeulu && (
        <form className="lb-addname" onSubmit={e => { e.preventDefault(); if (newName.trim() && addMember){ addMember(newName.trim()); setNewName(''); } }}>
          <input className="tr-input" placeholder="Add a name…" value={newName} onChange={e => setNewName(e.target.value)} />
          <button className="fa-btn fa-btn--ghost" type="submit" style={{ minHeight: 50, padding: '0 20px', fontSize: 17 }}>Add</button>
        </form>
      )}

      {namedSel.length < 2 && (
        <div className="lb-count">
          <span className="lb-count__label">{isTeulu && members.length ? 'or just pick how many are here:' : 'How many are round the table?'}</span>
          <div className="lb-count__opts">
            {[2, 3, 4, 5].map(n => <button key={n} className={'lb-count__n' + (count === n ? ' on' : '')} onClick={() => setCount(n)}>{n}</button>)}
          </div>
        </div>
      )}

      <button className="fa-btn fa-btn--ink" onClick={start}><Icon name="fwd" size={20} /> {startLabel}</button>
      <span className="lb-setup__hint">{namedSel.length >= 2 ? ('Passing round ' + namedSel.length + ' players') : (isTeulu ? ('Passing round ' + count + ' seats') : ('Passing round ' + count + ' seats · Tirio Teulu lets everyone play by name'))}</span>
    </div>
  );
}

export function PlateBuilder({ go, mark, family, addMember, trackPlay, trackMember }){
  const FOODS = DD.plateRefs;
  const [phase, setPhase] = useState('setup');   // setup | turn | reveal
  const [roster, setRoster] = useState([]);       // bounded list of seat labels
  const [turnIx, setTurnIx] = useState(0);
  const [chain, setChain] = useState([]);
  const [picking, setPicking] = useState(false);
  const [ended, setEnded] = useState(false);
  const [reason, setReason] = useState('check');  // check | full | forgot
  const [playingId, play] = useSimAudio();
  const markedRef = useRef(false);

  const available = FOODS.filter(id => !chain.includes(id));
  const full = available.length === 0;
  const cvar = { '--tile-c': 'var(--tile-teal)' };
  const current = roster.length ? roster[turnIx % roster.length] : 'You';
  const seatIx = roster.length ? turnIx % roster.length : 0;

  function startWith(r){ setRoster(r); setChain([]); setTurnIx(0); setEnded(false); setPhase('turn'); }
  function addFood(id){
    const adder = roster.length ? roster[turnIx % roster.length] : null;
    const mem = adder && family && family.members ? family.members.find(mm => mm.name === adder) : null;
    if (mem && trackMember) trackMember(mem.id, { turns: 1 });
    setChain(c => [...c, id]); play('say-' + id); setPicking(false);
    setTurnIx(i => i + 1); setPhase('pass');
    if (!markedRef.current){ mark('dinner', 'family'); markedRef.current = true; }
  }
  function peek(){ setReason('check'); setEnded(false); setPhase('reveal'); }
  function endRound(why){
    setReason(why); setEnded(true); setPhase('reveal');
    if (trackPlay) trackPlay('llond_bol', { reached: chain.length, players: roster.length, result: why });
    if (trackMember && family && family.members){
      const star = chain.length ? roster[(turnIx - 1 + roster.length) % roster.length] : null;
      const sm = star ? family.members.find(mm => mm.name === star) : null;
      if (sm) trackMember(sm.id, { wins: 1 });
      family.members.forEach(m => { if (roster.includes(m.name)) trackMember(m.id, { games: 1 }); });
    }
  }
  function finish(){ mark('dinner', 'family'); go('dinner-family'); }

  const revealTitle = ended
    ? (reason === 'full' ? 'Llond bol — a full plate!' : 'You remembered ' + chain.length + '!')
    : 'The plate so far';
  const revealSub = ended
    ? 'Da iawn — that’s a lovely long plate. Tap any to hear it, then go again?'
    : 'Tap any to hear it. Carry on if you remembered them all — or end the round here.';

  return (
    <div className="sg" style={cvar}>
      <div className="fa__bar">
        <button className="fa__close" onClick={() => go('dinner-family')} aria-label="Close"><Icon name="close" /></button>
        <span className="fa__kicker">Family game · Llond Bol</span>
        {phase === 'turn' && chain.length > 0 && !picking &&
          <button className="sg__again" onClick={peek}><Icon name="check" size={15} /> Flip to check</button>}
      </div>

      {/* setup — who's at the table (Free = anonymous seats; Teulu = named) */}
      {phase === 'setup' && (
        <PlayerSetup family={family} addMember={addMember}
          title="Llond Bol · a memory plateful"
          blurb="Take turns round the table — say the whole plate from memory, then add one more. It’ll pass to each of you in turn."
          startLabel="Start the plate" onStart={startWith} />
      )}

      {/* a turn */}
      {phase === 'turn' && (
        <div className="sg__body">
          <RoleBand leftWelsh={current} leftGloss="says the plate · adds one" rightWelsh="Pawb" rightGloss="everyone · listens & helps" activeSide="L" />
          <div className="bt-seats" aria-label="whose turn">
            {roster.map((nm, i) => <span key={i} className={'bt-seat' + (i === seatIx ? ' active' : '')}>{i + 1}</span>)}
          </div>
          <div className="sayprompt">
            {chain.length === 0 ? (
              <>
                <span className="sayprompt__lead">{current} starts</span>
                <span className="sayprompt__big">Add the first food</span>
                <span className="sayprompt__sub">Pick something and say it in Welsh so everyone hears it.</span>
              </>
            ) : (
              <>
                <span className="sayprompt__lead">{current} · {chain.length} on the plate</span>
                <span className="sayprompt__big">Say the whole plate</span>
                <span className="sayprompt__sub">From memory, in Welsh.</span>
              </>
            )}
          </div>

          <div className="lb-plate">
            {chain.length === 0 && <span className="lb-plate__empty">the plate’s empty…</span>}
            {chain.map((id, i) => (
              <div key={i} className="lb-cover">
                <span className="lb-cover__disc"><span className="lb-cover__num">{i + 1}</span><span className="lb-cover__q">?</span></span>
              </div>
            ))}
          </div>

          {full ? (
            <button className="fa-btn fa-btn--ink" onClick={() => endRound('full')}><Icon name="check" size={20} /> Plate’s full — see it</button>
          ) : (
            <button className="fa-btn fa-btn--ink" onClick={() => setPicking(true)}><Icon name="fwd" size={20} /> {chain.length === 0 ? 'Add the first food' : 'Said it all? Add the next food'}</button>
          )}
          {chain.length > 0 && <button className="lb-endlink" onClick={() => endRound('forgot')}>We forgot one — end the round</button>}
        </div>
      )}

      {/* pass the tablet to the next person */}
      {phase === 'pass' && (
        <div className="passcard" style={cvar}>
          <span className="passcard__eyebrow">Pass the tablet · {chain.length} on the plate</span>
          <span className="passcard__big">{current}, you’re up</span>
          <span className="passcard__who">hand it round the table</span>
          <span className="passcard__sub">Say the whole plate out loud — in Welsh, from memory — then add one more of your own.</span>
          <button className="peek__close" onClick={() => setPhase('turn')}><Icon name="fwd" size={20} /> I’m {current} — ready</button>
        </div>
      )}

      {/* reveal — peek mid-game, or the end-of-round summary */}
      {phase === 'reveal' && (
        <div className="sg__body">
          <div className="sayprompt">
            <span className="sayprompt__big">{revealTitle}</span>
            <span className="sayprompt__sub">{revealSub}</span>
          </div>
          <div className="lb-plate">
            {chain.map((id, i) => {
              const w = DD.wordById[id];
              return (
                <button key={i} className="lb-cover flipped" onClick={() => play('say-' + id)}>
                  <span className="lb-cover__disc"><span className="lb-cover__num">{i + 1}</span>{w.art && <img className="lb-cover__img" src={w.art} alt={w.english} />}</span>
                  <span className="lb-cover__welsh">{w.welsh}</span>
                </button>
              );
            })}
          </div>
          <div className="fa__actions">
            {ended ? (
              <>
                <button className="fa-btn fa-btn--ghost" onClick={() => setPhase('setup')}><Icon name="refresh" size={18} /> Play again</button>
                <button className="fa-btn fa-btn--ink" onClick={finish}>Done →</button>
              </>
            ) : (
              <>
                <button className="fa-btn fa-btn--ink" onClick={() => setPhase('turn')}><Icon name="fwd" size={18} /> Keep going</button>
                <button className="fa-btn fa-btn--paper" onClick={() => endRound('forgot')}>End the round</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* picking peek — name a food, it goes face-down */}
      {picking && (
        <div className="peek">
          <span className="peek__eyebrow"><Icon name="fwd" size={14} /> {current} adds to the plate</span>
          <span className="peek__title">Pick one — then say it</span>
          <span className="peek__hide-note">Tap to add it (and hear it). It goes face-down on the plate, so say it nice and loud.</span>
          <div className="lb-pick">
            {available.map(id => {
              const w = DD.wordById[id];
              return (
                <button key={id} className="lb-pick__item" onClick={() => addFood(id)}>
                  {w.art && <img src={w.art} alt="" draggable="false" />}
                  <span className="lb-pick__welsh">{w.welsh}</span>
                  <span className="lb-pick__en">{w.english}</span>
                </button>
              );
            })}
          </div>
          <button className="peek__close" onClick={() => setPicking(false)} style={{ background: 'var(--surface-sunken)', color: 'var(--text-primary)' }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BWRDD Y TEULU  —  "The family table"  (route: dinner-cafe)
   ============================================================ */
const BT_ASKS = [
  { phraseId: 'phrase_gair_llaeth_plis', foodId: 'word_llaeth_dinner' },
  { phraseId: 'phrase_ga_i_fwy_o_datws', foodId: 'word_tatws_dinner' },
  { phraseId: 'phrase_gair_halen',       foodId: 'word_halen_dinner' },
];
const BT_DECOYS = ['word_pys_dinner','word_caws_dinner','word_dwr_dinner','word_bara_dinner','word_pasta_dinner','word_cig_dinner'];
const BT_DINERS = 3; // round the table

export function CafeRoleplay({ go, mark, family, addMember, trackPlay, trackMember }){
  const [phase, setPhase] = useState('setup');  // setup | pass | ask | served | done
  const [roster, setRoster] = useState([]);
  const [ri, setRi] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [tried, setTried] = useState([]);
  const [result, setResult] = useState(null);
  const [playingId, play] = useSimAudio();
  const markedRef = useRef(false);
  const roundsRef = useRef([]);

  function buildRounds(n){
    const asks = [];
    for (let i = 0; i < n; i++) asks.push(BT_ASKS[i % BT_ASKS.length]);
    return dShuffle(asks).map(ask => {
      const decoys = pickN(BT_DECOYS, 3, [ask.foodId]);
      return { ...ask, dishes: dShuffle([ask.foodId, ...decoys]) };
    });
  }
  function startWith(r){ setRoster(r); roundsRef.current = buildRounds(r.length); setRi(0); setTried([]); setResult(null); setPeeking(false); setPhase('pass'); }

  const diners = roster.length;
  const round = roundsRef.current[ri];
  const phrase = round ? DD.phraseById[round.phraseId] : null;
  const target = round ? DD.wordById[round.foodId] : null;
  const diner = diners ? roster[ri] : 'Person';

  function openRound(){ setPeeking(true); setPhase('ask'); setTried([]); setResult(null); }
  function pass(id){
    if (peeking || result || !round) return;
    const ok = id === round.foodId;
    setResult({ id, ok }); play('pass-' + id);
    if (ok){ if (!markedRef.current){ mark('dinner', 'family'); markedRef.current = true; } const mem = family && family.members ? family.members.find(mm => mm.name === diner) : null; if (mem && trackMember) trackMember(mem.id, { turns: 1, correct: tried.length === 0 ? 1 : 0 }); setTimeout(() => setPhase('served'), 950); }
    else { setTried(s => [...s, id]); setTimeout(() => setResult(null), 1500); }
  }
  function nextDiner(){
    if (ri + 1 >= diners){ setPhase('done'); if (trackPlay) trackPlay('bwrdd_y_teulu', { players: diners, result: 'all_fed' }); if (trackMember && family && family.members){ family.members.forEach(m => { if (roster.includes(m.name)) trackMember(m.id, { games: 1 }); }); } return; }
    setRi(i => i + 1); setPhase('pass'); setTried([]); setResult(null);
  }
  function finish(){ mark('dinner', 'family'); go('dinner-family'); }
  function again(){ setPhase('setup'); setRi(0); markedRef.current = false; }

  const cvar = { '--tile-c': 'var(--tile-indigo)' };
  const seats = (
    <div className="bt-seats" aria-label="round the table">
      {roster.map((nm, i) => (
        <span key={i} className={'bt-seat' + (i < ri ? ' fed' : '') + (i === ri && phase !== 'done' ? ' active' : '')}>
          {i < ri ? <Icon name="check" size={16} /> : i + 1}
        </span>
      ))}
    </div>
  );

  return (
    <div className="sg" style={cvar}>
      <div className="fa__bar">
        <button className="fa__close" onClick={() => go('dinner-family')} aria-label="Close"><Icon name="close" /></button>
        <span className="fa__kicker">Family game · Bwrdd y Teulu</span>
        {phase === 'ask' && !peeking &&
          <button className="sg__again" onClick={() => setPeeking(true)}><Icon name="sound" size={15} /> {diner}: hear it again</button>}
      </div>

      {phase === 'setup' && (
        <PlayerSetup family={family} addMember={addMember}
          title="Bwrdd y Teulu · the family table"
          blurb="It’s dinner and everyone’s hungry. Each of you asks for something in Welsh; the rest work out what to pass. Set who’s at the table."
          startLabel="Sit down to eat" onStart={startWith} />
      )}

      {phase !== 'setup' && (
        <div className="sg__body">
          <RoleBand leftWelsh={diner} leftGloss="hungry · asks in Welsh" rightWelsh="Pawb" rightGloss="everyone · passes it" activeSide="L" />
          {seats}

          {phase === 'ask' && round && (
            <>
              <div className="sayprompt">
                <span className="sayprompt__lead">{diner} → the table</span>
                <span className="sayprompt__big">Ask for it out loud, in Welsh</span>
                <span className="sayprompt__sub">No Welsh on the dishes — the only way the table knows what to pass is if you ask, and the only way they pass the right thing is if they know the word.</span>
                <span className="gate-chip"><Icon name="mic" size={13} /> say it, then the family passes it</span>
              </div>
              <div className="cc-menu-label">On the table — pass {diner} what they asked for</div>
              <div className="cc-board">
                {round.dishes.map(id => {
                  const w = DD.wordById[id];
                  const back = tried.includes(id);
                  const cls = ['cc-dish', back ? 'tried' : '', result && result.id === id ? (result.ok ? 'hit' : 'miss') : ''].filter(Boolean).join(' ');
                  return (
                    <button key={id} className={cls} onClick={() => pass(id)} aria-label={'Pass the ' + w.english}>
                      {w.art && <img src={w.art} alt={w.english} draggable="false" />}
                      <span className="cc-dish__en">{w.english}</span>
                      <span className="cc-dish__serve">{result && result.id === id && result.ok ? <><Icon name="check" size={15} /> {w.welsh}</> : 'pass'}</span>
                    </button>
                  );
                })}
              </div>
              <div className="cc-feedback">
                {result && !result.ok && <>Not that one — <small>that’s the {DD.wordById[result.id].english}. Listen again and ask once more.</small></>}
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'pass' && round && (
        <div className="passcard" style={cvar}>
          <span className="passcard__eyebrow">{ri === 0 ? 'Bwrdd y Teulu · the family table' : 'Round the table'}</span>
          <span className="passcard__big">{diner}, you’re hungry</span>
          <span className="passcard__who">your turn to ask</span>
          <span className="passcard__sub">Peek at what you’re craving — keep it to yourself — then ask the table for it in Welsh.</span>
          <button className="peek__close" onClick={openRound}><Icon name="fwd" size={20} /> See what you want</button>
        </div>
      )}

      {peeking && round && (
        <div className="peek">
          <span className="peek__eyebrow"><Icon name="heart" size={14} /> {diner} only — don’t show!</span>
          <span className="peek__title">You’re craving…</span>
          <div className="order">
            {target.art && <img className="order__img" src={target.art} alt={target.english} draggable="false" />}
            <span className="order__phrase">{phrase.welsh}</span>
            <span className="order__en">{phrase.natural}</span>
            <button className={'order__say' + (playingId === 'order' ? ' is-playing' : '')} onClick={() => play('order', 1600)}>
              <Icon name={playingId === 'order' ? 'sound' : 'play'} size={18} /> {playingId === 'order' ? 'Playing…' : 'Tap to hear it'}
            </button>
          </div>
          <span className="peek__hide-note">{phrase.pron}</span>
          <button className="peek__close" onClick={() => setPeeking(false)}><Icon name="check" size={20} /> Ready — hide it and ask</button>
        </div>
      )}

      {phase === 'served' && round && (
        <div className="sg-done" style={cvar}>
          <span className="sg-done__burst">Dyna chi!</span>
          <div className="sg-done__plate">{target.art && <img src={target.art} alt={target.english} />}</div>
          <span className="sg-done__sub">The family passed the <b>{target.welsh}</b> ({target.english}). Now {diner}, say thank you —</span>
          <button className="cc-diolch" onClick={() => play('diolch', 1200)}>
            <Icon name={playingId === 'diolch' ? 'sound' : 'play'} size={18} /> “Diolch!” <small>thank you</small>
          </button>
          <div className="fa__actions">
            <button className="fa-btn fa-btn--ink" onClick={nextDiner}>{ri + 1 >= diners ? 'Finish →' : 'Next person →'}</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="sg-done" style={cvar}>
          <span className="sg-done__burst">Mae pawb wedi bwyta! 🎉</span>
          <span className="sg-done__sub"><b>Everyone’s eaten.</b> Each person asked in Welsh and the family worked out what to pass. Who’s still hungry?</span>
          <div className="fa__actions">
            <button className="fa-btn fa-btn--ghost" onClick={again}><Icon name="refresh" size={20} /> Still hungry — again</button>
            <button className="fa-btn fa-btn--ink" onClick={finish}>Done →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================ CHALLENGES */
function dinnerChallenge(id){ return DD.challenges.find(c => c.id === id); }

export function DinnerChallengeDeck({ go, mark }){
  return (
    <div className="chl">
      <TopBar title="Take it further" onBack={() => go('dinner')} />
      <div className="chl__deck" style={{ justifyContent: 'flex-start', paddingTop: 8, overflowY: 'auto' }}>
        <p className="muted" style={{ margin: '0 0 4px', fontSize: 17 }}>Pick a challenge. These happen at the table, away from the screen.</p>
        {DD.challenges.map(c => (
          <button key={c.id} className="chl-card" style={{ '--tile-c': `var(--tile-${c.color})`, background: `var(--tile-${c.color})` }}
            onClick={() => go('dinner-challenge-full', { challenge: c.id })}>
            <span className="chl-card__kicker">{c.category}</span>
            <span className="chl-card__title" style={{ fontSize: 'var(--fs-h1)' }}>{c.title}</span>
            <span className="chl-card__how">{c.prompt}</span>
            <span className="chl-card__dur">{c.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DinnerChallengeFull({ challenge, go, mark }){
  const c = dinnerChallenge(challenge);
  return (
    <div className="fa" style={{ '--tile-c': `var(--tile-${c.color})`, background: `var(--tile-${c.color})` }}>
      <div className="fa__bar">
        <button className="fa__close" onClick={() => go('dinner-challenge')} aria-label="Close"><Icon name="close" /></button>
        <span className="fa__kicker">Challenge card</span>
      </div>
      <div className="chl-full">
        <span className="chl-full__kicker">{c.category} · {c.duration}</span>
        <span className="chl-full__title">{c.title}</span>
        <span className="chl-full__how">{c.prompt}</span>
        <span className="chl-full__welsh">{c.welsh}</span>
        <span className="chl-full__alt"><strong>Another way:</strong> {c.alternative}</span>
        <div className="chl-full__go">
          <button className="away__back" onClick={() => { mark('dinner', 'challenge'); go('dinner-challenge-away', { challenge }); }}>Let’s go →</button>
        </div>
      </div>
    </div>
  );
}

export function DinnerChallengeAway({ challenge, go }){
  const c = dinnerChallenge(challenge);
  const longDur = c.duration === 'one meal';
  const [mode, setMode] = useState(longDur ? 'timer' : 'card');
  const [secs, setSecs] = useState(0);
  useEffect(() => { const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  return (
    <div className={`away${mode === 'dim' ? ' away--dim' : ''}`} style={{ '--tile-c': `var(--tile-${c.color})`, background: mode === 'dim' ? undefined : `var(--tile-${c.color})` }}>
      <span className="away__name">{c.title}</span>
      {mode === 'timer' && <span className="away__timer">{mm}:{ss}</span>}
      <span className="away__hint">{mode === 'dim' ? 'Tap when you’re ready to come back.' : 'The app is waiting. Go and play — come back when you’re done.'}</span>
      <button className="away__back" onClick={() => go('dinner-challenge-return', { challenge })}>We’re back</button>
      <div className="away__modes">
        {['card', 'dim', 'timer'].map(m => <button key={m} className={`away__mode${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}><span>{m}</span></button>)}
      </div>
    </div>
  );
}

export function DinnerChallengeReturn({ go }){
  const [ans, setAns] = useState(null);
  const opts = [{ k: 'go', t: 'We gave it a go' }, { k: 'loved', t: 'We loved it' }, { k: 'nope', t: 'Didn’t quite work today' }];
  const ack = { go: 'Lovely. That counts.', loved: 'Wonderful — do it again soon.', nope: 'That’s fine. Come back to it.' };
  return (
    <div className="ret">
      {ans ? (
        <>
          <DotMark />
          <div className="ret__ack">{ack[ans]}</div>
          <div className="ret__opts"><Button kind="primary" size="lg" block onClick={() => go('dinner')}>Back to Amser Bwyd</Button></div>
        </>
      ) : (
        <>
          <div className="ret__title">You’re back!</div>
          <div className="ret__q">How did it go?</div>
          <div className="ret__opts">{opts.map(o => <button key={o.k} className="ret-opt" onClick={() => setAns(o.k)}>{o.t}</button>)}</div>
          <button className="ret__skip" onClick={() => go('dinner')}>Skip</button>
        </>
      )}
    </div>
  );
}
