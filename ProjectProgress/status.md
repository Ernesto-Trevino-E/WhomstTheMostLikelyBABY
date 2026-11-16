# Project Status — WhomstTheMostBABY

> Single source of truth for "where are we". Read this FIRST at the start of every session.
> Update it at the END of every phase (and whenever a blocker or decision appears).
> History of what changed lives in `changelog.md`; the plan lives in `ContextFiles/03-build-plan.md`.

**Last updated:** 2026-11-15
**Current phase:** Phase 2 — Firebase layer (NOT STARTED)
**Next action:** Do the two Firebase manual steps below (RTDB check/create, Anonymous auth), then enter plan mode and plan Phase 2.

---

## Phase checklist

Status values: `[ ]` not started · `[~]` in progress · `[x]` done and committed

- [x] **Phase 0** — Scaffold: Vite + React + TS, Tailwind v4 theme, fonts, env files
- [x] **Phase 1** — Design system: reusable components + dev gallery
- [ ] **Phase 2** — Firebase layer: auth, data model, room codes, hooks, presence, first rules
- [ ] **Phase 3** — Pre-game: landing, create/join, lobby, prompt pool
- [ ] **Phase 4** — Core loop: prompt, vote, reveal, scoreboard
- [ ] **Phase 5** — Edge cases and room lifecycle
- [ ] **Phase 6** — Polish: animations, sound, haptics
- [ ] **Phase 7** — Hardening, deploy to Cloudflare, QA

---

## Manual steps for the user (Claude Code cannot do these)

- [ ] Create the Realtime Database in the Firebase console (choose region, locked mode) — needed before Phase 2. **Check first:** the `whomst-web` SDK config already returns a `databaseURL` (`impastababy-67140-default-rtdb`), so a default RTDB may already exist. Confirm in the console whether it exists and whether the other game uses it.
- [x] Enable **Anonymous** sign-in under Authentication — needed before Phase 2 (done by user 2026-11-15)
- [ ] Choose the Cloudflare deploy method (wrangler CLI vs GitHub auto-deploy) — needed before Phase 7
- [ ] Add the deployed Cloudflare domain to Firebase Authorized domains — Phase 7
- [ ] If building on Cloudflare from GitHub: set `VITE_FIREBASE_*` as build variables in the Cloudflare dashboard — Phase 7

---

## Open decisions (resolve in the phase noted, then record the answer here and in the changelog)

- [ ] **Grace period / presence mechanism** (30s before a disconnected player counts as "left"; no server exists, so clients must enforce it) — decide in Phase 2
- [ ] **Vote anonymity enforcement** (rules that hide votes until reveal vs. UI-only anonymity) — decide in Phase 2
- [ ] **Prompt -> Vote transition** (host button vs. automatic short delay) — decide in Phase 4
- [ ] **Optional features** (kick, host toggle for player prompt submissions, final-results highlights) — confirm in Phase 3 / 5

---

## Deviations from the context files

_None yet. If the build departs from anything in `ContextFiles/`, list it here with the reason._

---

## Resolved decisions

- **Gallery is dev-only (Phase 1, 2026-11-15):** `/#gallery` only works under `npm run dev`; the Gallery module is lazy-loaded behind `import.meta.env.DEV` and is not in the production bundle.
- **No icon or animation libraries (Phase 1, 2026-11-15):** icons are inline SVG (`src/components/icons.tsx`), motion is CSS keyframes in `src/index.css`. Phase 6 may add a library if the reveal needs it.
- **MuteToggle is UI-only (Phase 1, 2026-11-15):** it is a controlled component; `localStorage` persistence and real audio come in Phase 6.
- **Initials rule (Phase 1, 2026-11-15):** first letter of the first and last word (ignoring emoji-only words); a single word gives its first two letters; empty gives "?".
- **Firebase web app (Phase 0, 2026-11-15):** registered a separate web app `whomst-web` in the ImpastaBABY project, so the other game's `impasta-web` app is untouched. Its config is in `.env.local` (gitignored).

---

## Blockers / notes

- No blockers.
- Player color p9 (`#8FBFB0`) is the same as `sage` (HOST badge, info). A p9 player who is host has a sage avatar next to a sage badge. Kept as the brief says; consider changing p9 later.
- npm held two postinstall scripts (`@firebase/util`, `protobufjs`) under its install-scripts allowlist. Neither is needed for a Vite build, so both are left unapproved.
- Linting uses **oxlint** (create-vite's current default), not ESLint. Run it with `npm run lint`. Typecheck runs as part of `npm run build` (`tsc -b`).
