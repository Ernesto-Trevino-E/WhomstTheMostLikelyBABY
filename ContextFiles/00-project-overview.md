# WhomstTheMostBABY — Project Overview

## Concept
A web app game where people play together in rooms.

- A player can **create a room**; a **random room code** is generated on creation.
- Other players **join a room** by entering that code.

## Hosting options (undecided)
- **Vercel** — current plan for hosting the web app.
- **Cloudflare** (Pages/Workers) — open to experimenting; reportedly free to host.

## Backend / database options (undecided)
- **Firebase** — existing free project already used for another game.
- **Neon** — serverless Postgres with a free tier (recommended by a friend).

## Open Questions / Decisions
- [ ] Hosting: Vercel vs Cloudflare?
- [ ] Backend/DB: Firebase vs Neon (or other)?
- [ ] How will real-time room updates work (e.g. Firestore listeners, WebSockets, Durable Objects, polling)?
- [ ] Frontend framework?
- [ ] Game rules / core gameplay loop?
- [ ] Room lifecycle: max players, expiry, host-leaves behavior?

## Notes
_Add plans, decisions and context files to this folder as the project evolves._
