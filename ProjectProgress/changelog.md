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

## [2026-11-15] Planning — progress tracking and build plan created
**Status:** done
**Summary:** Created `ProjectProgress/` (status.md, changelog.md), `ContextFiles/03-build-plan.md` (8-phase plan), and a root `CLAUDE.md` so every Claude Code session resumes from the status file. No application code yet.
**Files added/changed:** `ProjectProgress/status.md`, `ProjectProgress/changelog.md`, `ContextFiles/03-build-plan.md`, `CLAUDE.md`
**Decisions made:** Build in 8 phases, one plan-mode session per phase, commit at the end of each phase.
**Deviations from context files:** none
**Deferred / follow-ups:** Phase 0 is next.
**How to verify:** open the files.
**Commit:** n/a
