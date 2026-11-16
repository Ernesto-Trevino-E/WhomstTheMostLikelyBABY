# WhomstTheMostBABY — Build Plan

Multi-step plan for Claude Code. Build **one phase per session**, in order. Each phase ends with a verified build, updated progress files, and a commit.

Progress is tracked in `ProjectProgress/status.md` (current state) and `ProjectProgress/changelog.md` (history). Specs live in `00-project-overview.md` (stack), `01-game-flow.md` (rules) and `02-styling-brief.md` (look and feel). This file only says what to build and in what order; do not duplicate those specs here.

## Ground rules
- Plan mode first for every phase: read the files, propose the approach, wait for approval.
- Stay inside the current phase. Note ideas for later phases in the changelog "Deferred" line.
- Keep the app static (no server code). All shared state lives in Firebase Realtime Database under `/whomst/...`.
- Never touch Firestore or other apps' data/rules.
- Every phase ends with the **Phase checkpoint** below.

## Phase checkpoint (end of every phase)
1. `npm run build` passes (plus typecheck/lint if set up).
2. `status.md` updated (tick phase, current phase, next action, manual steps, decisions, blockers, date).
3. New entry at the top of `changelog.md`.
4. Commit: `Phase N: <title>`.
5. Tell the user how to verify and what comes next.

---

## Phase 0 — Scaffold
**Goal:** a running, themed, empty app with the right tooling.

Tasks
- Scaffold Vite + React + TypeScript in the repo root (keep `ContextFiles/`, `ProjectProgress/`, `CLAUDE.md`, README, `.git`).
- Add Tailwind CSS v4 (Vite plugin) and put the `@theme` block from section 4.2 of the styling brief in the main CSS file.
- Load the three fonts (Orbitron, Space Grotesk, JetBrains Mono); self-hosting via fontsource is preferred.
- Global dark background with the dot grid; `<meta viewport>`, 16px base text, theme color.
- Add the Firebase SDK dependency. Create `.env.example` (blank `VITE_FIREBASE_*`) and a gitignored `.env.local`; verify `.gitignore` covers it.
- Folder structure: `src/components`, `src/screens`, `src/lib`, `src/hooks`, `src/data`.
- Use the Firebase MCP to fetch the web app SDK config into `.env.local` (if no web app exists in the project yet, ask the user before creating one).

Done when: `npm run dev` shows a themed placeholder screen with all three fonts; `npm run build` passes; no secrets in git.

## Phase 1 — Design system
**Goal:** every reusable component from section 4.4 of the styling brief, built and viewable without Firebase.

Tasks
- Components: Button (4 variants), PlayerChip, VoteCard, VoteBar, RoomCodeDisplay, CrownBadge, Panel (incl. double-border), Modal, Toast, Divider, Banner, MuteToggle, Sparkle.
- Player color assignment helper (10 colors, cycle by join order) and initials helper.
- Dev-only gallery screen (e.g. `#gallery`) that shows every component and state at 375px width.
- Screen-transition wrapper with `prefers-reduced-motion` support.

Done when: the gallery shows all components and states; tap targets are at least 48px; no soft shadows; gold only on crown/winner.

## Phase 2 — Firebase layer
**Goal:** a working data layer proven with two browser tabs, before any real screens.

Prerequisites (user): Realtime Database created, Anonymous auth enabled (see `status.md`).

Tasks
- Initialize Firebase (modular SDK), anonymous sign-in, typed helpers.
- Design and document the data model under `/whomst/rooms/{code}` (meta/phase/host, players with join number and presence, prompt pool, current round, votes, crown tallies). The prompt pool needs: player-submitted prompts (text = the ending only, a used flag, author id kept for limits but never shown), the host's category filter, and what has been drawn so far. Stock prompts have stable ids and live in the app, not the database. Write the model down in the changelog entry.
- Room code generator (4–5 chars, no look-alikes such as O/0/I/1) with collision check.
- React hooks wrapping listeners (room, players, round, votes).
- Presence with `onDisconnect` plus the 30-second grace-period approach. **Resolve the open decisions** (clients enforce grace/host succession; vote anonymity approach) and record them in `status.md`.
- Draft `database.rules.json` scoped to `/whomst`. Read the existing RTDB rules first; validate via the Firebase MCP; ask the user before deploying.
- Minimal temporary debug UI to create/join and show a live player list.

Done when: two tabs can create a room and join it by code and see each other live; closing a tab flips presence; rules validate.

## Phase 3 — Pre-game
**Goal:** landing through lobby, fully working with the real database.

Tasks
- Landing, Create form, Join form with validation errors (room not found, name taken, invalid code).
- Lobby: room code panel with copy/share, live player list, HOST badge, join-order numbering.
- Host controls: Start (disabled until 4 players), optional Kick (confirm modal), Prompts modal.
- Stock prompt deck as a typed data file (`src/data/prompts.ts`), built from `ContextFiles/04-prompt-deck.md`: stable id, category (Chill, Cheeky, Harsh, Gotcha) and the ending text only. The app adds the "Who's most likely to" lead-in.
- Prompts modal (host): category filter (all on by default) and the optional toggle for player submissions.
- Prompt submission form (lobby): ending only with the lead-in shown as fixed text, length limit, per-player cap and duplicate check (see `01-game-flow.md` 1.5). Submissions are anonymous and uncategorised. Reuse the same form component for the mid-game button in Phase 4.
- Room code in the URL hash so a link can be shared.

Done when: with 4+ tabs a host can create, others join, prompts can be submitted, Start unlocks at 4 players; non-hosts see "Waiting for host...".

## Phase 4 — Core game loop
**Goal:** a full round plays from prompt to scoreboard.

Tasks
- Phase machine driven by the room's `phase` field: LOBBY, PROMPT, VOTE, REVEAL, SCOREBOARD.
- Prompt draw per `01-game-flow.md` 1.5: unused player submissions first (shuffled), then category-filtered stock prompts (shuffled, no repeats), then reshuffle everything when the pool is used up. Copy the drawn text into the round so every device shows the same prompt. A filter change applies from the next draw. Resolve the Prompt-to-Vote transition decision.
- Vote screen: grid, select, Lock In, waiting state with "x / n VOTED" counts only, host End Voting early.
- "Add a prompt" button on the Vote screen (secondary, small, also available while waiting and to players sitting out): opens a Modal with the Phase 3 submission form, shows a toast on success and returns to voting without losing the selected card or the locked-in vote. A prompt submitted mid-round does not change the current round.
- Auto-advance to Reveal when everyone eligible has voted.
- Reveal: vote totals per player (anonymous), tie handling (all top players crowned), crown tallies updated once per round.
- Scoreboard with Next Round (host) and End Game (host); simple placeholder transitions (animations come in Phase 6).

Done when: several rounds play end to end across 4+ tabs, ties crown everyone tied, and nobody can see who voted for whom in the UI.

## Phase 5 — Edge cases and room lifecycle
**Goal:** every row of the edge-case table in `01-game-flow.md` behaves correctly.

Tasks
- Late joiners sit out the current round and vote from the next prompt; sage banner.
- Disconnect/reconnect within the grace period keeps the player number; red ring and "RECONNECTING..." state; self banner.
- Host succession to the next numbered player, toast, controls move; a returning original host rejoins as a regular player.
- Dropping below 4 players mid-game returns everyone to the lobby with the notice modal.
- End Game, Final results screen (podium, leaderboard, optional highlights), Play Again (same room, same players, scores reset) and Leave.
- Room cleanup when all players have left.

Done when: each edge case has been exercised manually and listed in the changelog "How to verify".

## Phase 6 — Polish
**Goal:** the big moments feel good.

Tasks
- Reveal sequence per section 4.5 (sequential bar fills, count-ups, pause, gold flash, crown drop, glow, confetti).
- Prompt reveal animation, vote lock-in pulse, scoreboard count-up.
- Sound set (tap, lock-in, drumroll, fanfare, error, join chime) with audio unlocked on first tap; MuteToggle persisted in `localStorage`.
- Haptics via `navigator.vibrate` with silent fallback.
- Full `prefers-reduced-motion` support.

Done when: a full round feels polished on a phone; mute works and persists; reduced motion removes the animations.

## Phase 7 — Hardening, deploy, QA
**Goal:** live on Cloudflare with locked-down rules.

Tasks
- Tighten the Realtime Database rules (only room members write their own data, only the host changes phase and moves, vote visibility per the Phase 2 decision, data size limits). Validate and, with user approval, deploy via the Firebase MCP.
- Cloudflare static assets config with single-page-app fallback; deploy via the method the user chose (wrangler or GitHub).
- Ask the user to add the deployed domain to Firebase Authorized domains; set build variables if building from GitHub.
- QA pass on small phones and desktop; fix issues; update README with run/deploy instructions.

Done when: the deployed URL works on a phone with several players, direct links do not 404, and the README explains setup.
