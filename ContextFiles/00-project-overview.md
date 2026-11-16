# WhomstTheMostBABY — Project Overview

## Concept
A web app game where people play together in rooms.

- A player can **create a room**; a **random room code** is generated on creation.
- Other players **join a room** by entering that code.
- Full game flow (pre-game, round cycle, edge cases): see `01-game-flow.md`.

## Hosting — DECIDED
- **Cloudflare** (Workers static assets, free plan). The app is a static frontend talking directly to Firebase, so no server-side hosting is needed.
- Reasons: static bandwidth and requests are unmetered on the free plan, and commercial use is allowed. Vercel Hobby caps bandwidth at 100GB/month and is restricted to personal, non-commercial projects.
- Vercel was the earlier plan; switching later is cheap since the build output is the same static files.
- Remember to add the deployed domain to Firebase's authorized domains if Firebase Auth is used.

## Backend / database — DECIDED
- **Firebase Realtime Database**, using the existing free Firebase project already used for another game.
- Reasons: native live updates for lobby and votes, plus `onDisconnect` presence detection for player-left, host passing and empty-room cleanup. Nothing needs to be stored long-term.
- Neon (serverless Postgres) was considered but would need extra pieces (WebSockets, polling or Durable Objects) for real-time.

## Frontend — DECIDED
- **React + Vite + TypeScript**, built to static files and served from Cloudflare.
- **Tailwind CSS** for styling (styling details will be worked out in a separate chat).
- No router needed: screens follow the room's `phase` field from Firebase, and the room code can live in the URL hash.
- Cloudflare needs a single-page-app fallback in the static assets config so direct links don't 404.
- Firebase modular SDK listeners are wrapped in React hooks for live lobby and vote updates.

## Open Questions / Decisions
- [x] Hosting: Cloudflare (static assets, free).
- [x] Backend/DB: Firebase (Realtime Database).
- [x] Real-time room updates: Firebase Realtime Database listeners.
- [x] Frontend framework: React + Vite + TypeScript, styled with Tailwind CSS.
- [x] Game rules / core gameplay loop: see `01-game-flow.md`.
- [x] Room lifecycle: no player limit, minimum 4 to start, host passes to the next numbered player, room deleted when all players have left (about 30 second grace period for disconnects).

## Tooling / MCP — LOADED
- **Firebase MCP is already installed and connected in Claude Code** (official `firebase-tools` MCP server). The implementation plan should assume Claude Code can use it directly instead of asking the user to copy values from the Firebase console by hand: look up the web app SDK config, initialize and validate the Realtime Database security rules, and deploy the rules.
- The Firebase MCP uses the user's Firebase CLI login and has access to the whole existing project, which also holds another game's **Firestore** data. Keep all of this game's data under its own top-level path (`/whomst/...`) in the Realtime Database, and do not touch Firestore or the other app's data or rules.
- Still manual for the user: create the Realtime Database in the Firebase console (choose region, locked mode), enable **Anonymous** sign-in under Authentication, and later add the deployed Cloudflare domain to Authorized domains.
- Cloudflare is handled with `wrangler` (local `wrangler login`/`wrangler deploy`), or auto-deploy from GitHub. Deploy method is still to be chosen.
- Env vars: `.env.local` (real values, gitignored) and `.env.example` (blank, committed) in the project root. `VITE_FIREBASE_*` values are baked in at build time, so if Cloudflare builds from GitHub they must also be set in the Cloudflare dashboard build variables. Not created yet.

## Notes
_Add plans, decisions and context files to this folder as the project evolves._
