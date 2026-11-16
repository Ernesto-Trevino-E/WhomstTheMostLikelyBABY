# Changelog — WhomstTheMostBABY

> Newest entries on top. One entry per phase (or per meaningful change within a phase).
> Claude Code: add an entry at the end of every phase BEFORE committing. Never delete old entries.

## Entry template

```
## [YYYY-MM-DD] Phase N — Title
**Status:** done | partial (say what is left)
**Summary:** 1–3 sentences on what now works.
**Files added/changed:** key paths only.
**Decisions made:** choices and the reason (link to status.md open decisions that were resolved).
**Deviations from context files:** none | what and why.
**Deferred / follow-ups:** things pushed to a later phase.
**How to verify:** commands or steps the user can run (e.g. `npm run dev`, what to click).
**Commit:** short hash or message.
```

---

## [2026-11-16] Phase 4 — Core game loop
**Status:** done
**Summary:** Full rounds now play end to end: Start draws a prompt (player submissions first, then category-filtered stock, reshuffling when the pool runs out), the host taps Start voting, everyone votes anonymously (Lock In, "x / n VOTED" counts only, Add a prompt mid-round), Reveal starts on its own once everyone online has voted or when the host ends voting, ties crown everyone tied, and the Scoreboard shows the crown tally with Next Round, Prompts (filter between rounds) and End Game. End Game shows a temporary Game over list with Back to lobby.
**Files added/changed:** `src/lib/game.ts` (draw + transitions), `src/screens/{PromptScreen,VoteScreen,RevealScreen,ScoreboardScreen,GameOver}.tsx`, `src/components/GameScreen.tsx`, `src/hooks/useAction.ts`, `src/screens/Room.tsx` (phase switch, auto-reveal), `src/lib/{rooms,model}.ts`, `src/components/Button.tsx` (`danger-outline`), `src/screens/Gallery.tsx`, `src/App.tsx` + `src/hooks/useHashRoute.ts` (debug route removed), `database.rules.json` (deployed). Removed `src/screens/DebugFirebase.tsx`.
**Data model additions:** `round/tally/{uid}: number`, the vote counts frozen when voting ends (rules deployed). `meta/lastScoredRound` is now set in the same transaction that moves VOTE → REVEAL, and crowns use `increment(1)`.
**Decisions made:** Prompt → Vote by the host's Start voting button (resolves the open decision); Reveal → Scoreboard by the host's Scores button; End Game shows a placeholder for now; draw/reshuffle rules, eligibility snapshot and the auto-reveal rule as recorded in status.md.
**Deviations from context files:** End Game placeholder (`GameOver.tsx`) until Phase 5; results frozen in `round/tally` (new node).
**Deferred / follow-ups:**
- Phase 5: real final results, Play Again (reset scores and `drawn`?), Leave; fewer than 4 players → lobby modal; the self "reconnecting" banner; late joiners during PROMPT could be added to `eligible`; remove test rooms `XVJF`, `RWRD`, `JSDX`.
- Phase 6: reveal sequence, prompt scale-in, lock-in pulse, scoreboard count-up.
- Phase 7: rules so only the host moves `meta`/`round`, ballots only during VOTE and only from eligible players.
- If the tab that ends voting dies between the phase change and the tally write, that round has no frozen tally (Reveal falls back to live counts) and no crowns. Rare; revisit in Phase 7.
- The reshuffle branch (whole pool used up) was not reached in testing; it is a small pure function (`pickPrompt`).
**How to verify:**
- `npm run build` and `npm run lint` pass.
- `npm run dev`, create a room as Ana, join Bo, Cy and Di in **new** tabs. As Bo, add a prompt in the lobby. Ana starts → every tab shows "ROUND 1" with Bo's prompt; only Ana has **Start voting**.
- Vote screen: select a card, open **Add a prompt**, close it → the selection is still there. Lock In → cards dim, "1 / 4 VOTED" on that tab, no names.
- Vote so two players tie (e.g. 2–2) → every tab goes to Reveal by itself, both are crowned ("It's a tie!"). Reload Ana's tab on Reveal → crowns don't change. Ana taps **Scores** → each winner shows +1 and x1.
- Ana → Prompts, turn off Chill, Cheeky and Harsh → following rounds only use Gotcha prompts (`drawn` in the console shows `gotcha-*`).
- Next Round, Start voting, then **End Voting** with no votes → "No votes this round, so nobody gets a crown."
- During a vote, join a 5th tab (Eve) → sage banner, can't vote, not a vote option, counts stay "/ 4". Eve can vote in the next round.
- Firebase console: `ballots/r{n}` hold only target uids; `round/tally` matches the reveal; `scores` went up once per round.
- Scoreboard → **End Game** → confirm → Game over list on every tab; Ana's **Back to lobby** returns everyone to the lobby.
**Commit:** Phase 4: Core game loop

## [2026-11-16] Phase 3 — Pre-game
**Status:** done
**Summary:** The real app now runs from landing to lobby on the live database. Players can create a room, or join one by code or shared link (`#/ABCD`), with errors shown under the field they belong to. The lobby updates live with join numbers, HOST/YOU/RECONNECTING badges, copy/share, host kick (with confirm), a host Prompts modal (category filter and submissions toggle), and anonymous "Add a prompt" for everyone. Start unlocks at 4 active players; non-hosts see "Waiting for host...". The 82-prompt stock deck is in `src/data/prompts.ts`.
**Files added/changed:** `src/data/prompts.ts`, `src/lib/{prompts,model,rooms,presence}.ts`, `src/hooks/{useHashRoute,useRoom}.ts`, `src/components/{TextField,Switch,Screen,PromptSubmitForm,PromptsModal}.tsx`, `src/screens/{Landing,CreateRoom,JoinRoom,Room,Lobby}.tsx`, `src/screens/Gallery.tsx` (TextField + Switch sections), `src/App.tsx`, `database.rules.json` (deployed)
**Data model additions:** `kicked/{uid}: true` (host-only write). `prompts/{pushId}` is now written by the submit form.
**Decisions made:** deck used as-is; kick included with a rules deploy; submission limits 80 chars / 5 waiting per player / duplicates vs waiting, used and stock; submissions toggle included; at least one category stays on; hash routing. Details are under Resolved decisions in status.md.
**Deviations from context files:** Start sets `phase = PROMPT` and shows a temporary "Game started" panel with a host-only Back to lobby until Phase 4.
**Deferred / follow-ups:**
- Phase 4: replace the Start placeholder with the first draw; reuse `PromptSubmitForm` in the Vote screen modal; let the host open the Prompts modal between rounds.
- Phase 5: remove leftover test rooms `XVJF` and `RWRD`; free names of players who left without pressing Leave.
- Remove the dev-only `/#debug` screen when it's no longer useful.
- The host-change toast ran in code but was not caught on screen during testing (it lasts 3s); worth a look when verifying.
**How to verify:**
- `npm run build` and `npm run lint` pass. The production bundle has no gallery/debug code.
- `npm run dev`, open http://localhost:5173 → Create Room as "Ana" → URL becomes `#/XXXX`, lobby shows Ana #1 HOST/YOU, Start disabled with "Need 4 players (1 / 4)".
- In **new** tabs (not Duplicate), open the room link → Join form with the code filled in. Try "ana" → "Someone in this room already has that name." under the name. On `#/join`, code "XV1F" → invalid code; an unused code → "No open room with that code."
- Join as Bo, Cy, Di → every tab updates live; at 4 players Start enables for Ana only; others see "Waiting for host...".
- Reload Bo's tab → still #2 in the lobby.
- Add a prompt: "Who's most likely to Fall asleep at a party?" → "That prompt is already in the deck." A new one → toast, "1 player prompt waiting" on every tab. A 6th waiting prompt from the same player → cap message. In the Firebase console, `prompts` hold only the ending.
- Host → Prompts: turn off three categories → the last one locks. Turn off player prompts → other tabs show "player prompts are off" and their form is disabled. Turn everything back on.
- Host kicks Di (confirm) → Di's tab goes home with "You were removed from this room."; Start locks again; Di's name is free (a new tab can join as Di, with a new number).
- Start → every tab shows "Game started"; the host's Back to lobby returns everyone.
- Close the host's tab and wait ~30s → Ana shows RECONNECTING, then disappears; Bo becomes HOST and gets the controls.
**Commit:** Phase 3: Pre-game

## [2026-11-16] Phase 2 — Firebase layer
**Status:** done
**Summary:** The app signs in anonymously (one player per tab) and can create and join rooms in the Realtime Database. Rooms have unique 4-letter codes, case-insensitive name locks, join numbers, live presence with a 30s grace period, derived host succession, and anonymous ballots. RTDB rules for `/whomst` are deployed. A dev-only `/#debug` screen proves it across tabs.
**Files added/changed:** `firebase.json`, `.firebaserc`, `database.rules.json`, `src/lib/{firebase,model,roomCode,rooms,presence,votes}.ts`, `src/hooks/{useDbValue,useAuth,useServerNow,usePresence,useRoom}.ts`, `src/screens/DebugFirebase.tsx`, `src/App.tsx`
**Data model** (`/whomst/rooms/{code}`):
```
meta:     { createdAt, hostUid, phase (LOBBY|PROMPT|VOTE|REVEAL|SCOREBOARD|FINAL_RESULTS),
            nextJoinNumber, roundNumber (0 before first round), lastScoredRound }
settings: { allowSubmissions, categories: { chill, cheeky, harsh, gotcha } }
players/{uid}: { name, joinNumber, joinedAt, joinedRound, online, lastSeen }   // owner-only writes
names/{nameKey}: uid       // lowercased, URI-encoded name lock; create-if-absent, owner delete
scores/{uid}: crowns       // separate so the host can write crowns
prompts/{pushId}: { text (ending, ≤80), key, authorUid (never shown), used, createdAt }
drawn/{promptId}: true     // stock ids + submission ids used this cycle
round:    { number, promptId, source (stock|player), text, startedAt, eligible/{uid}: true }
ballots/r{round}/{pushId}: targetUid    // never linked to a voter
voted/r{round}/{uid}: true              // written in the same update as the ballot
```
Round keys use an `r` prefix so RTDB never turns them into arrays. Stock prompts live in the app (Phase 3).
**Decisions made:** vote anonymity = anonymous ballots; identity = per tab; presence/grace = `onDisconnect` + `lastSeen` + server time, with the host derived on every client and claimed by writing `meta/hostUid`; names are 1–16 chars; codes are 4 letters without I/L/O. Details are under Resolved decisions in status.md.
**Deviations from context files:** stale rooms aren't reused when creating (a fresh code is picked instead). Rules weren't pre-validated because the MCP rules tools fail with "Invalid URL"; the deploy compiled them. See status.md.
**Deferred / follow-ups:**
- Deleting stale rooms, freeing names and removing records of players who left, and host-change toasts in the real UI: Phase 5.
- Tighter rules (host-only phase changes, eligible-only votes, one ballot per write, size limits): Phase 7.
- Leftover test room `XVJF` in RTDB.
**How to verify:**
- `npm run build` and `npm run lint` pass. The production bundle has no Firebase/debug code yet (debug is dev-only).
- `npm run dev`, open http://localhost:5173/#debug in tab A and create a room as "Ana" → code shown, Ana #1 HOST.
- Open a **new** tab (not "Duplicate") at `/#debug` and join with the code as "Bo" → both tabs list both players live.
- Join as "ana" → NAME_TAKEN; code "XV1F" → INVALID_CODE; an unused code → ROOM_NOT_FOUND.
- Reload Bo's tab → still #2. Close it → Ana's tab shows Bo RECONNECTING with a countdown, then LEFT after 30s.
- Add "Cy", close the host's tab, and wait 30s → Cy becomes HOST and "stored host" updates.
- Cast test votes → counts update; "Try double vote" is rejected. In the Firebase console, `ballots` hold only target uids.
- Leave as the last player, then try to join that code → ROOM_NOT_FOUND.
**Commit:** Phase 2: Firebase layer

## [2026-11-16] Planning — prompt system added to the plan
**Status:** done (planning only, no application code changed)
**Summary:** Defined how "Who's most likely to" prompts work: endings only, a stock deck with categories plus anonymous player submissions, player submissions drawn first, and mid-game submission from the Vote screen.
**Files added/changed:** `ContextFiles/01-game-flow.md` (1.5, Prompt and Vote phase rows, decisions), `ContextFiles/03-build-plan.md` (Phases 2, 3, 4), `ContextFiles/04-prompt-deck.md` (new draft deck), `ProjectProgress/status.md` (open and resolved decisions)
**Decisions made:** see "Prompt system" under Resolved decisions in status.md.
**Deviations from context files:** replaces the old rule that submitted prompts are simply added to the shuffled pool.
**Deferred / follow-ups:** the user reviews and edits `04-prompt-deck.md`; Phase 3 turns it into `src/data/prompts.ts`.
**How to verify:** read the files above; nothing to run.
**Commit:** n/a

## [2026-11-15] Phase 1 — Design system
**Status:** done
**Summary:** Every reusable component from styling brief 4.4 is built with typed props and no Firebase: Button (4 variants), Panel (single/double, tones), PlayerChip, VoteCard, VoteBar, RoomCodeDisplay, CrownBadge, Modal, Toast (+ provider/hook), Divider, Banner, MuteToggle, Sparkle, plus a ScreenTransition wrapper and the corner background sparkles. A dev-only gallery at `/#gallery` shows every component and state at phone width.
**Files added/changed:** `src/components/*` (Button, Panel, PlayerChip, VoteCard, VoteBar, RoomCodeDisplay, CrownBadge, Modal, Toast, ToastProvider, Divider, Banner, MuteToggle, Sparkle, ScreenTransition, BackgroundSparkles, icons), `src/lib/{players,cn,toastContext}.ts`, `src/hooks/{usePrefersReducedMotion,useToast}.ts`, `src/screens/Gallery.tsx`, `src/App.tsx`, `src/index.css`
**Decisions made:**
- Gallery is dev-only (lazy import behind `import.meta.env.DEV`); production shows the placeholder.
- No new dependencies: inline SVG icons, CSS keyframes, native `<dialog>` for Modal (focus trap, Esc, backdrop).
- `playerColor(joinNumber)` cycles the 10 colors by 1-based join number; `initials(name)` takes first + last word letters, skips emoji-only words, falls back to "?".
- The double-border panel uses an inner `::before` line, not a shadow. Only glow shadows (gold/orange/red tokens) are used; avatar rings use Tailwind `ring`.
**Deviations from context files:** none
**Deferred / follow-ups:**
- MuteToggle persistence and sounds — Phase 6.
- Reveal sequencing (bar count-up, crown drop, confetti) — Phase 6; VoteBar has only a plain width transition now.
- Player color p9 equals `sage` (noted in status.md).
**How to verify:**
- `npm run dev`, open http://localhost:5173/#gallery, DevTools at 375px: every section (Button, Panel, PlayerChip, Player colors, VoteCard, VoteBar, RoomCodeDisplay, CrownBadge, Modal, Toast, Divider, Banner, Waiting row, Sparkle, ScreenTransition) renders with no horizontal scroll.
- Tap VoteCards (orange outline moves), Copy on the room code (shows "Copied!"), fire info/error toasts (gone after 3s), open each modal and close it with Esc / backdrop / buttons, Randomize the VoteBars (ties crown every top row), Replay the transition.
- DevTools → Rendering → `prefers-reduced-motion: reduce`: the gallery header says "Reduced motion: on" and Replay is instant.
- Gold only appears on the gold Panel sample, crowned PlayerChips, crowned VoteBars and CrownBadges.
- `npm run build` and `npm run lint` pass. `npm run build && npm run preview`, then `/#gallery` shows the placeholder, not the gallery.
**Commit:** Phase 1: Design system

## [2026-11-15] Phase 0 — Scaffold
**Status:** done
**Summary:** The app is a Vite 8 + React 19 + TypeScript project with Tailwind v4 and the full `@theme` from the styling brief. It has self-hosted Orbitron, Space Grotesk and JetBrains Mono, and a dark dot-grid background. A placeholder screen shows the wordmark, a room code panel and palette swatches. The Firebase SDK is installed but not initialized yet.
**Files added/changed:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `index.html`, `public/favicon.svg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/env.d.ts`, `src/{components,screens,lib,hooks,data}/.gitkeep`, `.env.example`, `.gitignore`, `.claude/launch.json`
**Decisions made:**
- Registered a new Firebase web app `whomst-web` instead of reusing `impasta-web` (user's choice). Its config is in `.env.local`, which is gitignored.
- Fonts are self-hosted with fontsource, loading only the brief's weights.
- Kept create-vite's defaults: oxlint for linting and TypeScript 7.
**Deviations from context files:** none
**Deferred / follow-ups:**
- The static corner sparkles in the global background come with the `Sparkle` component in Phase 1.
- The SDK config already includes a `databaseURL`. In Phase 2, check whether a default RTDB already exists and who uses it before writing rules.
**How to verify:**
- Run `npm install`, then `npm run dev`, and open http://localhost:5173. You should see a dark navy background with a faint dot grid, the Orbitron "WHOMST THE MOST?" wordmark, Space Grotesk body text and the mono "WHMS" code. Check at 375px in DevTools that there's no horizontal scroll.
- `npm run build` and `npm run lint` should both pass.
- In `git show --stat HEAD`, `.env.example` should be listed and `.env.local` should not.
**Commit:** Phase 0: Scaffold

## [2026-11-15] Planning — progress tracking and build plan created
**Status:** done
**Summary:** Created `ProjectProgress/` (status.md, changelog.md), `ContextFiles/03-build-plan.md` (8-phase plan), and a root `CLAUDE.md` so every Claude Code session resumes from the status file. No application code yet.
**Files added/changed:** `ProjectProgress/status.md`, `ProjectProgress/changelog.md`, `ContextFiles/03-build-plan.md`, `CLAUDE.md`
**Decisions made:** Build in 8 phases, one plan-mode session per phase, commit at the end of each phase.
**Deviations from context files:** none
**Deferred / follow-ups:** Phase 0 is next.
**How to verify:** open the files.
**Commit:** n/a
