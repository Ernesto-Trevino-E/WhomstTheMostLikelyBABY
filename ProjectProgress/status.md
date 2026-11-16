# Project Status — WhomstTheMostBABY

> Single source of truth for "where are we". Read this FIRST at the start of every session.
> Update it at the END of every phase (and whenever a blocker or decision appears).
> History of what changed lives in `changelog.md`; the plan lives in `ContextFiles/03-build-plan.md`.

**Last updated:** 2026-11-15
**Current phase:** Phase 0 — Scaffold (NOT STARTED)
**Next action:** Enter plan mode, read the context files, and plan Phase 0.

---

## Phase checklist

Status values: `[ ]` not started · `[~]` in progress · `[x]` done and committed

- [ ] **Phase 0** — Scaffold: Vite + React + TS, Tailwind v4 theme, fonts, env files
- [ ] **Phase 1** — Design system: reusable components + dev gallery
- [ ] **Phase 2** — Firebase layer: auth, data model, room codes, hooks, presence, first rules
- [ ] **Phase 3** — Pre-game: landing, create/join, lobby, prompt pool
- [ ] **Phase 4** — Core loop: prompt, vote, reveal, scoreboard
- [ ] **Phase 5** — Edge cases and room lifecycle
- [ ] **Phase 6** — Polish: animations, sound, haptics
- [ ] **Phase 7** — Hardening, deploy to Cloudflare, QA

---

## Manual steps for the user (Claude Code cannot do these)

- [ ] Create the Realtime Database in the Firebase console (choose region, locked mode) — needed before Phase 2
- [ ] Enable **Anonymous** sign-in under Authentication — needed before Phase 2
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

## Blockers / notes

_None yet._
