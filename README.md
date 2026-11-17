# Whomst The Most?

A mobile-first "Who's most likely to..." party game. One player creates a room and shares the 4-letter code or link, everyone joins on their phone (4+ players), and each round the group votes anonymously on a prompt. The top player (or tied players) gets a crown.

React + Vite + TypeScript + Tailwind CSS v4, Firebase Realtime Database with anonymous auth, served as static files by a Cloudflare Worker. There is no server code.

## Run it locally

Needs Node 20+.

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase web app config
npm run dev                  # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server. `/#gallery` shows the component gallery (dev only). |
| `npm run build` | Typecheck (`tsc -b`) and build to `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | Serve the built `dist/` on port 4173 |

To test multiplayer on one computer, open each player in a **new** tab (not "Duplicate tab"): each tab is its own anonymous player.

## Firebase setup

The Firebase project is shared with another game that uses **Firestore**. This game only uses the **Realtime Database**, under `/whomst/...`. Never change Firestore data or rules from here.

1. Realtime Database created (locked mode).
2. Authentication → Sign-in method → **Anonymous** enabled.
3. A web app registered (`whomst-web`); its config goes in `.env.local` (`VITE_FIREBASE_*`; `MEASUREMENT_ID` is unused).
4. Security rules live in `database.rules.json` and deploy with the Firebase CLI (database only):
   ```bash
   npx firebase-tools deploy --only database
   ```
   Read the live rules in the console first so nothing that belongs to another app is overwritten.
5. Authentication → Settings → **Authorized domains** includes the deployed Cloudflare domain.

What the rules enforce: only signed-in users; only the room's host changes the phase, round, settings, prompt draw and scores; players write only their own record; a new host can only take over from a host who left; votes are accepted only during voting, once per player per round, from and for eligible players, and never record who voted for whom; size limits on names (16), prompts (80) and round text.

## Deploy (Cloudflare Workers, from GitHub)

`wrangler.jsonc` describes a Worker named `whomst` that serves `dist/` as static assets with a single-page-app fallback (unknown paths serve `index.html`, so links never 404).

The Worker is connected to this GitHub repo in the Cloudflare dashboard (Workers & Pages), so **every push to `main` builds and deploys**:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build variables: the seven `VITE_FIREBASE_*` values from `.env.local` (they are baked into the bundle at build time; the Firebase web config is public by design, access is controlled by the rules).

To deploy by hand instead: `npm run build`, then `npx wrangler login` and `npx wrangler deploy`.

## Project docs

- `ContextFiles/` — overview, game flow, styling brief, build plan, prompt deck.
- `ProjectProgress/status.md` — current state and decisions; `ProjectProgress/changelog.md` — history per phase.
