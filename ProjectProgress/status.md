# Project Status — WhomstTheMostBABY

> Single source of truth for "where are we". Read this FIRST at the start of every session.
> Update it at the END of every phase (and whenever a blocker or decision appears).
> History of what changed lives in `changelog.md`; the plan lives in `ContextFiles/03-build-plan.md`.

**Last updated:** 2026-11-16
**Current phase:** Phase 4 — Core game loop (NOT STARTED)
**Next action:** Verify Phase 3 (see the changelog's "How to verify"), then start a new session, enter plan mode and plan Phase 4.

---

## Phase checklist

Status values: `[ ]` not started · `[~]` in progress · `[x]` done and committed

- [x] **Phase 0** — Scaffold: Vite + React + TS, Tailwind v4 theme, fonts, env files
- [x] **Phase 1** — Design system: reusable components + dev gallery
- [x] **Phase 2** — Firebase layer: auth, data model, room codes, hooks, presence, first rules
- [x] **Phase 3** — Pre-game: landing, create/join, lobby, prompt pool
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
- [ ] **Final-results highlights** (optional) — confirm in Phase 5

---

## Deviations from the context files

- **Start is temporary (Phase 3):** Start sets `meta/phase = PROMPT` and shows a "Game started" placeholder with a host-only Back to lobby, until Phase 4 builds the loop.

- **Stale rooms are not reused for new codes (Phase 2):** the plan said a create could take over a stale room's code. Rules don't allow deleting a room yet, so `createRoom` just picks another code (279k codes). Revisit with room cleanup in Phase 5.
- **Rules were not pre-validated (Phase 2):** the Firebase MCP's `validate_security_rules` and `get_security_rules` fail with "Invalid URL" for RTDB. Current rules were read through `realtimedatabase_get_data` on `/.settings/rules`, and the deploy itself compiled the rules (it succeeded).

---

## Resolved decisions

- **Stock deck (Phase 3, 2026-11-16, user):** the draft `04-prompt-deck.md` is used as-is (82 prompts: 15 Chill, 30 Cheeky, 17 Harsh, 20 Gotcha) in `src/data/prompts.ts`. Ids are `{category}-{nnn}` and stable: never renumber, only append.
- **Kick (Phase 3, 2026-11-16, user):** included. The host writes `kicked/{uid} = true` (rules: only the room's `meta/hostUid`); the kicked tab removes its own player, name lock and score, then goes home. The same tab can't rejoin (KICKED). Kicked players never count as active or as host.
- **Prompt submission limits (Phase 3, 2026-11-16, user):** ending only, ≤ 80 chars after cleanup (trim, collapse spaces, strip a pasted "Who's most likely to" and trailing ?.!, lowercase a capitalised first word); max 5 unused submissions per player; case-insensitive duplicates rejected against waiting, used and stock prompts. Client-enforced; rules cap length at 80.
- **Submissions toggle (Phase 3, 2026-11-16, user):** included in the host Prompts modal (default on). Off disables the Add-a-prompt form; existing submissions stay in the pool.
- **Category filter scope (Phase 3, 2026-11-16):** host changes it in the lobby Prompts modal (Phase 4 adds it between rounds); stock prompts only; at least one category always stays on.
- **Routing (Phase 3, 2026-11-16):** hash routes `#/` landing, `#/create`, `#/join`, `#/ABCD` room. Opening a room link as a non-member shows Join with the code filled in; reloading as a member returns to the room.

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
- RTDB rules are deployed (from `database.rules.json` via `firebase.json`, database only); Phase 3 added the host-only `kicked` node. Rooms `XVJF` (Phase 2) and `RWRD` (Phase 3) are leftover test data; remove them with Phase 5 cleanup.
- `/#debug` (Phase 2 debug screen) is still in the dev build; remove it once Phase 4 no longer needs it.
- A player's name lock stays with them after they drop out without pressing Leave. Phase 5 should free names (and remove player records) for players who have left.
- Player color p9 (`#8FBFB0`) is the same as `sage` (HOST badge, info). A p9 player who is host has a sage avatar next to a sage badge. Kept as the brief says; consider changing p9 later.
- npm held two postinstall scripts (`@firebase/util`, `protobufjs`) under its install-scripts allowlist. Neither is needed for a Vite build, so both are left unapproved.
- Linting uses **oxlint** (create-vite's current default), not ESLint. Run it with `npm run lint`. Typecheck runs as part of `npm run build` (`tsc -b`).
