# Tirio — Welsh family play

**Tirio** is a family language-play app that helps English-speaking families learn Welsh **together**, out loud, around one device. It covers **Yr Wyddor** (the Welsh alphabet) and **Amser Bwyd** (dinner time), with family games built around one principle: **speaking Welsh aloud is the load-bearing action** — the games can't progress unless a person says a Welsh word across the table.

> There is **no speech recognition** — the spoken-Welsh requirement is enforced by *mechanic design* (hidden information + turn-passing), not by listening through a microphone.

This repository contains a **Next.js 14** application, ported pixel-for-pixel from the Claude Design prototype that lives in `project/`.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

The app renders inside an iPad frame (the design is iPad-first). React fonts come from Google Fonts, so a network connection is needed on first load.

---

## How it's built

- **Next.js 14 App Router**, rendered entirely client-side (`next/dynamic` with `ssr: false`) — the app uses a custom in-memory stack router and `localStorage`, so there's nothing to server-render.
- **A custom stack router** (`src/app-root.tsx`) — screens push/pop on a stack; no URL routing. This matches the prototype's navigation model.
- **Design-system CSS kept verbatim** under `styles/` — the token layer (colors, type, spacing, radius, motion) plus the app, dinner, and game stylesheets. Class names are unchanged from the design source.
- **Hand-drawn illustration set** in `public/art/` (dinner foods) and `public/art/alpha/` (alphabet words).

```
app/
  layout.tsx        HTML shell, Google Fonts, iPad frame + scaling
  page.tsx          client-only mount of the app
  globals.css       imports the design-system + app stylesheets
src/
  app-root.tsx      router, persisted state, tiers, tracking, learner gate
  components/
    primitives.tsx  Icon, Button, AudioButton, Tile, WordCard, Waveform, …
    tweaks-panel.tsx in-app tweaks panel (Alt+T to open)
  screens/
    shell.tsx       Splash, Auth, Home, Alphabet, Account sheet, leaderboard
    letter.tsx      letter detail + parent reference/supplemental
    family.tsx      family activities, word builder, challenges
    dinner.tsx      Amser Bwyd overview, reference, practise, say-it-together
    dinner-games.tsx Llond Bol, Bwrdd y Teulu, dinner challenges
  lib/
    data.ts         alphabet + shared content
    data-art.ts     attaches illustrations to words
    data-dinner.ts  Amser Bwyd content (foods, phrases, challenges)
public/art/         hand-drawn SVG illustrations
styles/             design-system tokens + app CSS
```

---

## The speech-gate (the core design rule)

Every family game is structured so a Welsh word **must be said aloud** for play to continue — via **hidden information** or **turn-passing**: one player sees or hears something the others can't, and the only way forward is to say it across the table.

- **Bwrdd y Teulu** (*the family table*) — each player, in turn, sees a secret craving and must **ask for it in Welsh**. Everyone else sees the dishes as **pictures + English only — never the Welsh word** — so passing the right thing requires *comprehending* what was said.
- **Llond Bol** (*a bellyful*) — a memory game: the family piles food on a **covered** plate; each turn you **recite the whole plate from memory, in Welsh**, then add one more. The covers mean the only record of the plate is what people *said*.

App audio is a **model to imitate**, never a substitute for speaking.

---

## Accounts, tiers & tracking

- **Account = the family.** On **Free**, the account is one shared profile.
- **Tirio Teulu** (paid tier) unlocks **named members** (up to 6), per-person **progress tracking**, and a **family leaderboard** (wins · correct · turns · activities done).
- On Teulu, entering any progress-tracking activity asks **"Who's learning?"** and shows a switchable learner pill. Turn-taking games pick their players up front instead.
- All account/family/tracking state persists to `localStorage`.

---

## Design source

The original Claude Design export is preserved for reference:

- `project/` — the HTML/React prototype the app was ported from
- `chats/` — the design conversation transcripts

The Next.js app under `app/`, `src/`, `styles/`, and `public/` is the implementation.
