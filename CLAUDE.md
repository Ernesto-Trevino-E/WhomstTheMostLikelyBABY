# WhomstTheMostBABY — Instructions for Claude Code

A mobile-first "Who's most likely to..." party game played in rooms. React + Vite + TypeScript + Tailwind v4, Firebase Realtime Database, hosted as static files on Cloudflare.

## Start of every session
1. Read `ProjectProgress/status.md` (where we are, next action, blockers).
2. Read the last 2–3 entries of `ProjectProgress/changelog.md`.
3. Read `ContextFiles/03-build-plan.md` for the current phase only, plus whichever of these you need:
   - `ContextFiles/00-project-overview.md` — stack and hosting decisions
   - `ContextFiles/01-game-flow.md` — rules, phases, edge cases
   - `ContextFiles/02-styling-brief.md` — palette, fonts, Tailwind theme, screens, components
4. Do not rely on memory of earlier sessions; the files are the source of truth.

## Working rules
- Work on ONE phase per session. Use plan mode first, wait for approval, then build.
- Do not start the next phase, even if there is time left. Stop at the phase checkpoint.
- If something in the context files is ambiguous or wrong, ask the user instead of guessing, and record the answer in `status.md`.
- If you must deviate from the context files, list it under "Deviations" in `status.md` and in the changelog entry.

## End of every phase (required before stopping)
1. Run `npm run build` (and lint/typecheck if configured). Fix errors.
2. Update `ProjectProgress/status.md`: tick the phase, set "Current phase" and "Next action", update manual steps, open decisions, blockers, and the "Last updated" date.
3. Add a new entry at the TOP of `ProjectProgress/changelog.md` using its template.
4. Commit with a message like `Phase N: <title>`. Do not push unless the user asks.
5. Tell the user what to verify and what the next phase is.

## Firebase guardrails
- The Firebase project is shared with another game that stores data in **Firestore**. Never read, write, or change Firestore data or rules.
- All data for this game lives under the top-level Realtime Database path `/whomst/...`.
- The Firebase MCP is connected: use it for SDK config, rules validation, and rules deploy. Before deploying Realtime Database rules, read the existing rules first so nothing belonging to another app is overwritten, and ask the user before deploying.
- Never commit real keys: `.env.local` is gitignored; `.env.example` (blank values) is committed.

## Style guardrails (details in `02-styling-brief.md`)
- Dark only. Mobile first (single column, max ~480px). 48px minimum tap targets, 16px minimum body text.
- Use the Tailwind theme tokens from the brief; no soft drop shadows (glows only); gold is reserved for the crown/winner.
- Respect `prefers-reduced-motion`.
