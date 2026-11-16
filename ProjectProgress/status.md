# Project Status — WhomstTheMostBABY

> Single source of truth for "where are we". Read this FIRST at the start of every session.
> Update it at the END of every phase (and whenever a blocker or decision appears).
> History of what changed lives in `changelog.md`; the plan lives in `ContextFiles/03-build-plan.md`.

**Last updated:** 2026-11-16
**Current phase:** Phase 3 — Pre-game (NOT STARTED)
**Next action:** Review/edit the draft stock deck `ContextFiles/04-prompt-deck.md`, then start a new session, enter plan mode and plan Phase 3.

---

## Phase checklist

Status values: `[ ]` not started · `[~]` in progress · `[x]` done and committed

- [x] **Phase 0** — Scaffold: Vite + React + TS, Tailwind v4 theme, fonts, env files
- [x] **Phase 1** — Design system: reusable components + dev gallery
- [x] **Phase 2** — Firebase layer: auth, data model, room codes, hooks, presence, first rules
- [ ] **Phase 3** — Pre-game: landing, create/join, lobby, prompt pool
- [ ] **Phase 4** — Core loop: prompt, vote, reveal, scoreboard
- [ ] **Phase 5** — Edge cases and room lifecycle
- [ ] **Phase 6** — Polish: animations, sound, haptics
- [ ] **Phase 7** — Hardening, deploy to Cloudflare, QA

---

## Manual steps for the user (Claude Code cannot do these)

- [x] Create the Realtime Database in the Firebase console (locked mode) — done by user 2026-11-16. Default instance `https://impastababy-67140-default-rtdb.firebaseio.com`, newly created and empty (root is `null`), so no other app uses it yet. Phase 2 read the locked defaults and then deployed this game's rules (only `/whomst` is open).
- [x] Enable **Anonymous** sign-in under Authentication — needed before Phase 2 (done by user 2026-11-15)
- [ ] Choose the Cloudflare deploy method (wrangler CLI vs GitHub auto-deploy) — needed before Phase 7
- [ ] Add the deployed Cloudflare domain to Firebase Authorized domains — Phase 7
- [ ] If building on Cloudflare from GitHub: set `VITE_FIREBASE_*` as build variables in the Cloudflare dashboard — Phase 7

---

## Open decisions (resolve in the phase noted, then record the answer here and in the changelog)

- [ ] **Prompt -> Vote transition** (host button vs. automatic short delay) — decide in Phase 4
- [ ] **Optional features** (kick, host toggle for player prompt submissions, final-results highlights) — confirm in Phase 3 / 5
- [ ] **Prompt submission limits** (length ~80 chars, cap ~5 waiting per player, duplicate rule) — confirm in Phase 3 plan mode
- [ ] **Category filter scope** (host changes it in lobby and between rounds; applies to stock prompts only) — confirm in Phase 3 plan mode
- [ ] **Review and edit the draft stock deck** `ContextFiles/04-prompt-deck.md` (user) — before Phase 3 is built

---

## Deviations from the context files

- **Stale rooms are not reused for new codes (Phase 2):** the plan said a create could take over a stale room's code. Rules don't allow deleting a room yet, so `createRoom` just picks another code (279k codes). Revisit with room cleanup in Phase 5.
- **Rules were not pre-validated (Phase 2):** the Firebase MCP's `validate_security_rules` and `get_security_rules` fail with "Invalid URL" for RTDB. Current rules were read through `realtimedatabase_get_data` on `/.settings/rules`, and the deploy itself compiled the rules (it succeeded).

---

## Resolved decisions

- **Vote anonymity (Phase 2, 2026-11-16, user):** anonymous ballots. A vote is one multi-path write of `ballots/r{round}/{pushId} = targetUid` plus `voted/r{round}/{uid} = true`; rules only accept a ballot when the voter's `voted` flag is new in the same write. The DB never links voter to target. Known limits for Phase 7: someone watching live could guess from timing, and one write could carry two ballots.
- **Identity (Phase 2, 2026-11-16, user):** per tab. Anonymous auth uses session persistence: reloading a tab keeps the player; a new tab is a new player. (Duplicating a tab copies its session, so testers should open new tabs instead.)
- **Grace period / presence (Phase 2, 2026-11-16):** `onDisconnect` writes `online=false, lastSeen=serverTimestamp`; a player is "left" when offline for more than 30s of server time. Every client derives the **effective host** (lowest join number among non-left players), and that player writes `meta/hostUid`. A room where every player has left is **stale** and joins get "room not found". Deleting stale rooms is Phase 5.
- **Names and codes (Phase 2, 2026-11-16):** names are 1–16 chars, trimmed, unique case-insensitively via a `names/{key}` lock. Room codes are 4 letters from `ABCDEFGHJKMNPQRSTUVWXYZ`.

- **Prompt system (planning, 2026-11-16):** prompts store only the ending and the app adds "Who's most likely to". Draw order is unused player submissions first, then category-filtered stock prompts, then reshuffle everything. Stock categories: Chill, Cheeky, Harsh, Gotcha (host filter; submissions are uncategorised and always included). Submissions are anonymous, live only in the room, and can be added in the lobby or mid-game via an "Add a prompt" button on the Vote screen. Tone: adult friends, mostly cheeky, nothing explicit. Details in `01-game-flow.md` 1.5, `03-build-plan.md` Phases 2-4 and `04-prompt-deck.md`.
- **Gallery is dev-only (Phase 1, 2026-11-15):** `/#gallery` only works under `npm run dev`; the Gallery module is lazy-loaded behind `import.meta.env.DEV` and is not in the production bundle.
- **No icon or animation libraries (Phase 1, 2026-11-15):** icons are inline SVG (`src/components/icons.tsx`), motion is CSS keyframes in `src/index.css`. Phase 6 may add a library if the reveal needs it.
- **MuteToggle is UI-only (Phase 1, 2026-11-15):** it is a controlled component; `localStorage` persistence and real audio come in Phase 6.
- **Initials rule (Phase 1, 2026-11-15):** first letter of the first and last word (ignoring emoji-only words); a single word gives its first two letters; empty gives "?".
- **Firebase web app (Phase 0, 2026-11-15):** registered a separate web app `whomst-web` in the ImpastaBABY project, so the other game's `impasta-web` app is untouched. Its config is in `.env.local` (gitignored).

---

## Blockers / notes

- No blockers.
- RTDB rules are deployed (from `database.rules.json` via `firebase.json`, database only). Room `XVJF` is leftover Phase 2 test data (all players left); it can be removed with Phase 5 cleanup.
- A player's name lock stays with them after they drop out without pressing Leave. Phase 5 should free names (and remove player records) for players who have left.
- Player color p9 (`#8FBFB0`) is the same as `sage` (HOST badge, info). A p9 player who is host has a sage avatar next to a sage badge. Kept as the brief says; consider changing p9 later.
- npm held two postinstall scripts (`@firebase/util`, `protobufjs`) under its install-scripts allowlist. Neither is needed for a Vite build, so both are left unapproved.
- Linting uses **oxlint** (create-vite's current default), not ESLint. Run it with `npm run lint`. Typecheck runs as part of `npm run build` (`tsc -b`).
