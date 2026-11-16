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
