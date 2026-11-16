# Project Status — WhomstTheMostBABY

> Single source of truth for "where are we". Read this FIRST at the start of every session.
> Update it at the END of every phase (and whenever a blocker or decision appears).
> History of what changed lives in `changelog.md`; the plan lives in `ContextFiles/03-build-plan.md`.

**Last updated:** 2026-11-16
**Current phase:** Phase 6 — Polish (NOT STARTED)
**Next action:** Verify Phase 5 (see the changelog's "How to verify"), then start a new session, enter plan mode and plan Phase 6.

---

## Phase checklist

Status values: `[ ]` not started · `[~]` in progress · `[x]` done and committed

- [x] **Phase 0** — Scaffold: Vite + React + TS, Tailwind v4 theme, fonts, env files
- [x] **Phase 1** — Design system: reusable components + dev gallery
- [x] **Phase 2** — Firebase layer: auth, data model, room codes, hooks, presence, first rules
- [x] **Phase 3** — Pre-game: landing, create/join, lobby, prompt pool
- [x] **Phase 4** — Core loop: prompt, vote, reveal, scoreboard
- [x] **Phase 5** — Edge cases and room lifecycle
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

- None at the moment.

---

## Deviations from the context files

- **Rooms abandoned without Leave are deleted lazily (Phase 5):** with no server, a room whose players all close their tabs can't delete itself. It is deleted when the last player presses Leave, or later when a join or create hits its code (user's choice, 2026-11-16). Rooms nobody touches again stay in the database.
- **`meta/gameBaseRound` (Phase 5):** new meta field (rules deployed). Round labels and highlights are relative to it, so a second game in the same room starts at Round 1 while ballot keys stay unique.
- **Results are frozen in `round/tally` (Phase 4):** not in the Phase 2 data model. When voting ends, the counts are copied to `round/tally/{uid}` and crowns are added once, so a late ballot can't change the reveal. Needed a rules addition (deployed).
- **Rules were not pre-validated (Phase 2):** the Firebase MCP's `validate_security_rules` and `get_security_rules` fail with "Invalid URL" for RTDB. Current rules were read through `realtimedatabase_get_data` on `/.settings/rules`, and the deploy itself compiled the rules (it succeeded).

---

## Resolved decisions

- **Play Again (Phase 5, 2026-11-16, user):** host button; everyone returns to the lobby. Non-hosts see "Waiting for host..." and Leave. **Start Game always starts a fresh game:** scores reset to 0 and round labels restart at 1 (covers Play Again and the below-4 return). `drawn` is kept so the next game doesn't repeat prompts straight away.
- **Final-results highlights (Phase 5, 2026-11-16, user):** included as three small panels computed from this game's anonymous ballots (no new data): Most crowned, Biggest landslide (most votes one player got in a round, at least 2), Ties (rounds that ended tied). The podium shows only players with at least one crown; tied players share a rank and a tone (gold 1st, cream 2nd, sage 3rd).
- **Room cleanup (Phase 5, 2026-11-16, user):** last Leave deletes the room; a join or create that hits a stale room deletes it (create then reuses the code). No sweep index. Rooms younger than 30s are never cleaned up (their first player may not be written yet).
- **Players who left (Phase 5, 2026-11-16):** the effective host deletes records (player, name lock, score) of players offline for more than 30s, which frees their names. A tab that comes back after the grace period finds its record gone (or removes it itself) and sees the Join form: it rejoins as a new player and never gets the host role back. Rules allow anyone to delete a player record that has been offline for more than 30s.
- **Below 4 players (Phase 5, 2026-11-16):** counts players online or within grace, so it fires about 30s after the 4th player drops (immediately on Leave). Not checked on Final results. Every tab that saw the game shows the sage "Not enough players" modal.
- **Late join during PROMPT (Phase 5, 2026-11-16):** Start voting adds active players to `round/eligible`, so a player who joined while the prompt showed plays that round. Joining during VOTE/REVEAL still sits out.
- **Self reconnecting banner (Phase 5, 2026-11-16):** red banner fixed at the top while `.info/connected` is false (only after the first connection, so no flash on load).

- **Prompt -> Vote (Phase 4, 2026-11-16, user):** the host taps **Start voting**; non-hosts see "Waiting for host...".
- **Reveal -> Scoreboard (Phase 4, 2026-11-16, user):** the host taps **Scores**; no auto-advance.
- **End Game for now (Phase 4, 2026-11-16, user):** simple Game over placeholder until Phase 5 (see Deviations).
- **Draw and reshuffle (Phase 4, 2026-11-16):** `prompts/{id}/used` = drawn at least once (frees the per-player cap); `drawn` = this cycle. Order: unused submissions, then filtered stock + played submissions not in `drawn`, then clear `drawn` and draw from the whole pool (avoiding the prompt just played).
- **Eligibility and auto-reveal (Phase 4, 2026-11-16):** `round/eligible` = active players at draw time; later joiners sit out (sage banner) and can't be voted for. Reveal starts automatically when every eligible player who is online has voted; offline players are not waited for. No votes = no crown.
- **/#debug removed (Phase 4, 2026-11-16):** the real game UI covers what it tested.
- **Button `danger-outline` variant (Phase 4):** red outline on dark, used for End Voting (brief: "red-outline End Voting").
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
- RTDB rules are deployed (from `database.rules.json` via `firebase.json`, database only); Phase 3 added the host-only `kicked` node, Phase 4 added `round/tally`, Phase 5 added room delete (only when it has no players), deleting players offline > 30s, freeing their name locks, and `meta/gameBaseRound`. Test rooms `XVJF`, `RWRD`, `JSDX` were deleted in Phase 5; `/whomst` was empty after Phase 5 testing.
- Phase transitions run on the effective host's tab, guarded by a `meta` transaction (expected phase + round). Rules still let any signed-in player write `meta`, `round` and ballots in any phase: tighten in Phase 7.
- Known race (Phase 7): if someone joins at the exact moment the last player's Leave deletes the room, the join can write a player into a room with no `meta`.
- Testing tip: when driving the dev app from the browser console, import app modules (`/src/lib/*.ts`) only. Importing `/node_modules/.vite/deps/firebase_database.js` without its `?v=` hash loads a second Firebase SDK copy and breaks writes in that tab (stack overflow in `ChildrenNode.equals`).
- Player color p9 (`#8FBFB0`) is the same as `sage` (HOST badge, info). A p9 player who is host has a sage avatar next to a sage badge. Kept as the brief says; consider changing p9 later.
- npm held two postinstall scripts (`@firebase/util`, `protobufjs`) under its install-scripts allowlist. Neither is needed for a Vite build, so both are left unapproved.
- Linting uses **oxlint** (create-vite's current default), not ESLint. Run it with `npm run lint`. Typecheck runs as part of `npm run build` (`tsc -b`).
