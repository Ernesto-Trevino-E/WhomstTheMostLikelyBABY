# WhomstTheMostBABY — Styling Brief

Briefing for the styling chat. Goal: settle the look and feel of the app, then hand back output that can be turned into a plan for Claude Code to build.

**Status:** styling decisions are made (sections 3 and 4). Remaining step: turn this brief into a build plan for Claude Code.

## 1. Context (already decided)

**The game:** a "Who's most likely to..." party game played in rooms. Each round shows a prompt, everyone votes for a player in the room (themselves included), and the results are revealed anonymously. The player with the most votes is crowned. The game is endless until the host ends it.

**Stack:**
- React + Vite + TypeScript, built to static files
- Tailwind CSS for styling (details in section 4)
- Hosted on Cloudflare (static assets, free plan)
- Firebase Realtime Database for live lobby and vote updates

**Other files to read first:**
- `00-project-overview.md` — decisions on hosting, database, frontend
- `01-game-flow.md` — full game flow, phases and edge cases

**Audience and device:** friends playing together, most likely on their phones. Design mobile first, then scale up to desktop.

## 2. Screens to design

1. **Landing** — Create Room and Join Room actions
2. **Create / Join forms** — display name, room code entry, clear error messages (code not found, name taken)
3. **Lobby** — room code with copy/share button, live player list, host controls (Start, kick, prompt pool), "Waiting for host..." state for non-hosts, "need 4 players" state, player prompt submission
4. **Prompt** — the "Who's most likely to..." question shown to everyone
5. **Vote** — pick one player (including yourself), waiting state after voting, host's "end voting early" control
6. **Reveal** — vote distribution per player (anonymous), crowned player(s), ties crowning several players
7. **Scoreboard** — running crown tally, host's "Next Round" button
8. **Final results** — leaderboard, optional highlights, Play Again / Leave
9. **Special states** — late joiner sitting out a round, player disconnected/reconnecting, host change notice, game returned to lobby (fewer than 4 players)

## 3. Styling decisions

Reference images (retro space UI kits and a "Planet Earth Control Deck" infographic) set the direction: a 70s retro-futuristic control panel on a dark background.

- [x] **Vibe and tone:** retro arcade / retro-futuristic control panel. Pill-shaped panels, thick outlines, halftone and stripe textures, small colored tick marks. Playful but tidy, not chaotic.
- [x] **Light / dark mode:** dark only. One theme, no light variant.
- [x] **Typography:** wide geometric display font for headings, buttons and labels; readable sans for body text; mono for the room code.
- [x] **Players:** each player gets an assigned color plus initials in a circle (works with no player limit).
- [x] **Animation level:** big reveal moments (count-ups, drumroll beat, crown drop, confetti); only light transitions elsewhere.
- [x] **Sound / haptics:** arcade sound effects plus phone vibration, with an always-visible mute toggle.
- [x] **Crowned player:** gold panel, crown icon and glowing outline; other rows dimmed. Every tied player gets the same treatment.
- [x] **Primary button:** cream pill with orange outline.
- [x] **Mobile-first layout:** 48px minimum tap targets, long player lists scroll inside the panel, host controls sticky at the bottom (see section 4.3).
- [x] **Room code display:** large mono letters in a framed panel with a copy/share button (see 4.3, Lobby).
- [x] **Tailwind theme values:** see section 4.2.

## 4. Styling spec (hand-back)

### 4.1 Palette and fonts

| Token | Hex | Use |
|---|---|---|
| `space` | `#0E0B1E` | App background |
| `panel` | `#1B2036` | Cards, panels, inputs |
| `slate` | `#4A5A7A` | Secondary buttons, dimmed elements, borders |
| `cream` | `#F4DB94` | Primary text on dark, primary button fill |
| `orange` | `#F58A1F` | Primary button outline, accents, progress fill |
| `gold` | `#F2B65E` | **Reserved for crown / winner only** |
| `red` | `#E8231B` | Danger actions (End Game, kick), alerts, reconnecting |
| `sage` | `#8FBFB0` | Info, success, host badge, dividers |

Text on cream, gold, orange and sage fills uses `space` (`#0E0B1E`). Muted text on dark is `cream` at 60% opacity.

**Player colors** (10, assigned in join order, cycling after 10; initials in `space`):
`#FF6B5A`, `#5BC0EB`, `#9BC53D`, `#A78BFA`, `#F472B6`, `#2EC4B6`, `#FF9F1C`, `#7C8CFF`, `#8FBFB0`, `#D291BC`. Gold is not used for players so the crown stays unique.

**Fonts** (load from Google Fonts or self-host):
- Display: **Orbitron** (700/900) for headings, buttons, labels, scores. If it feels too techy, Michroma is the fallback.
- Body: **Space Grotesk** (400/500/700).
- Mono: **JetBrains Mono** (700) for the room code and counts.
- The prompt text ("Who's most likely to...") uses Orbitron 700, wrapping freely, sized `clamp(1.5rem, 6vw, 2.5rem)`.

### 4.2 Tailwind theme (Tailwind v4, in the main CSS file)

```css
@import "tailwindcss";

@theme {
  --color-space: #0E0B1E;
  --color-panel: #1B2036;
  --color-slate: #4A5A7A;
  --color-cream: #F4DB94;
  --color-orange: #F58A1F;
  --color-gold: #F2B65E;
  --color-red: #E8231B;
  --color-sage: #8FBFB0;

  --color-p1: #FF6B5A;  --color-p2: #5BC0EB;  --color-p3: #9BC53D;
  --color-p4: #A78BFA;  --color-p5: #F472B6;  --color-p6: #2EC4B6;
  --color-p7: #FF9F1C;  --color-p8: #7C8CFF;  --color-p9: #8FBFB0;
  --color-p10: #D291BC;

  --font-display: "Orbitron", sans-serif;
  --font-body: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --radius-pill: 9999px;
  --radius-panel: 1.25rem;   /* 20px */
  --radius-chip: 0.75rem;    /* 12px */

  --shadow-glow-gold: 0 0 24px 4px rgb(242 182 94 / 0.55);
  --shadow-glow-orange: 0 0 16px 2px rgb(245 138 31 / 0.4);
  --shadow-glow-red: 0 0 16px 2px rgb(232 35 27 / 0.5);
}
```

If the project ends up on Tailwind v3, the same values go under `theme.extend` in `tailwind.config.ts`.

Global background: `bg-space` with a dot grid (`radial-gradient(circle, rgb(244 219 148 / 0.08) 1px, transparent 1px)` at 24px spacing) and a few static four-point sparkle SVGs in the corners.

### 4.3 Layout per screen (mobile first, single column, max width about 480px centered; desktop keeps the same column with larger type and more breathing room)

1. **Landing:** logo wordmark "WHOMST THE MOST?" in Orbitron 900 with a sparkle, centered near the top third. Two stacked full-width buttons: **Create Room** (primary cream pill) and **Join Room** (secondary slate pill). Small tagline below.
2. **Create / Join forms:** a panel with one or two inputs (display name; room code for Join). The code input is mono, uppercase, auto-capitalized, with large letter spacing. Errors appear under the field in red with a small icon ("Room not found", "That name is taken"). Primary action button at the bottom, Back as a text link.
3. **Lobby:** top: framed **room code panel** (code in mono at about 3rem, letter-spaced, with Copy and Share buttons beside it). Middle: "PLAYERS (n)" label with a dotted divider, then the live player list as PlayerChips (host marked with a sage crown-less "HOST" badge). The list scrolls inside the panel when long. Bottom, sticky: host sees **Start Game** (disabled with "Need 4 players" helper text until 4 are in) plus a Prompts button that opens a modal for the pool and submissions; non-hosts see "Waiting for host..." with a pulsing dot row. Kick is a small red icon button on each player row, host only.
4. **Prompt:** the prompt text centered in a large framed panel, round counter ("ROUND 3") as a small label above, a quick slide-in animation. No actions except an auto-moving state (the host's flow moves to Vote when ready).
5. **Vote:** prompt reminder at the top (smaller). Grid of VoteCards, 2 columns on phones, each a color circle with initials plus the name; yourself included and marked "YOU". Tapping selects (orange outline), a **Lock In** primary button confirms. After voting: the grid dims, a waiting panel shows a progress bar "7 / 9 VOTED" (counts only, no names). Host gets a sticky red-outline **End Voting** button.
6. **Reveal:** one row per player, sorted by votes descending. Each row: PlayerChip, a progress-bar-style VoteBar with a knob that fills to the count, and the number on the right. Bars count up in sequence with a drumroll beat, then the top row(s) turn into the **crown treatment** (gold panel, crown badge dropping in, gold glow, confetti burst); everyone else dims to 60%. Ties crown all top rows. Nobody is shown as having voted for anyone.
7. **Scoreboard:** list of players sorted by crowns, each with a crown count shown as small crown icons or "x3". Winners of the latest round have a brief pulse. Sticky bottom: host sees **Next Round** (primary) and a smaller **End Game** (red); non-hosts see "Waiting for host...".
8. **Final results:** large podium-style top 3 (gold, cream and sage panels, gold with glow), full leaderboard below, optional highlights (e.g. "Most crowned", "Closest vote") as small panels. Buttons: **Play Again** (primary) and **Leave** (secondary).
9. **Special states:**
   - *Late joiner:* an info banner (sage outline) "You joined mid-round. You're in from the next prompt." The screen is the normal view with voting disabled.
   - *Disconnected / reconnecting:* the player's chip shows a red ring and "RECONNECTING..." text with a small pulsing signal icon; for yourself, a top banner in red.
   - *Host change:* a toast "<name> is now the host" and the HOST badge moves; the new host sees their controls appear.
   - *Back to lobby (fewer than 4 players):* a modal with a sage outline "Not enough players. Back to the lobby to wait for more." and a single OK button.

### 4.4 Reusable components

- **Button:** variants `primary` (cream fill, orange 3px outline, `space` text), `secondary` (slate fill, cream 2px outline, cream text), `danger` (red fill, cream text), `ghost` (text only). Pill shape, Orbitron 700 uppercase, wide letter spacing, 48px minimum height, optional halftone or stripe texture on hover or press.
- **PlayerChip:** colored circle (from the 10 player colors) with initials, name beside it, optional badges (HOST, YOU, RECONNECTING), disconnected state with red ring.
- **VoteCard:** tappable PlayerChip in a panel, with `selected` (orange outline) and `disabled` states.
- **VoteBar:** the progress bar with a knob style from the references, `slate` track, `orange` fill, `gold` when crowned.
- **RoomCodeDisplay:** framed panel, mono letters, copy and share buttons, "Copied!" confirmation.
- **CrownBadge:** gold crown icon with glow, used on the Reveal and Scoreboard.
- **Panel:** `panel` fill, 2px `slate` outline, `rounded-panel`, optional double-border variant (extra inner line) for the prompt panel.
- **Modal:** centered Panel over a dark overlay, for prompt pool, kick confirm and the back-to-lobby notice.
- **Toast:** small pill at the top, auto-dismisses after 3 seconds, color by type (sage info, red error).
- **Divider:** dotted or dashed line in `sage` or `slate`, taken from the rulers in the references.
- **Banner:** full-width strip for late-joiner and reconnecting notices.
- **MuteToggle:** small icon button, always visible in a top corner.
- **Sparkle:** four-point star SVG for decoration.

### 4.5 Animation and sound notes

- **Screen transitions:** 150–200ms fade plus a slight upward slide. Respect `prefers-reduced-motion` (swap the animations for instant changes).
- **Prompt reveal:** text scales in from 0.95 with a fade, 300ms.
- **Vote lock-in:** selected card pulses once, haptic tap.
- **Reveal sequence:** bars fill one after another (about 600ms each, lowest to highest), numbers count up with the fill, a drumroll sound plays under it. Then a 400ms pause, the winner row(s) flash to gold, the crown drops from above with a bounce, glow fades in, confetti burst (cream, orange, gold, sage pieces), fanfare plays, long vibration.
- **Scoreboard:** crown counts tick up for the latest winners.
- **Sound set:** tap beep, lock-in blip, drumroll, fanfare, error buzz, join chime. Short and quiet by default. Audio only starts after the first user tap (mobile autoplay rule). The mute choice is remembered in `localStorage`.
- **Haptics:** `navigator.vibrate` (short on vote, long on crown). Silently skip on devices that don't support it (iOS Safari does not).

### 4.6 Consistency rules

- Spacing scale: 8px base (Tailwind spacing of 2, 4, 6, 8 and so on); panel padding 16px on mobile, 24px on desktop.
- Corner radius: pill for buttons and chips, 20px for panels, 12px for small chips and inputs.
- Outlines: 2px for normal panels, 3px for primary buttons and selected states.
- No soft drop shadows. The only shadows are glows (gold for crowns, orange for focus and selection, red for alerts).
- Gold is used for the crown and winners only, nowhere else.
- Minimum tap target 48px; body text at least 16px so iOS does not zoom on inputs.
- Text contrast: `cream` or `space` on the fills above (all pass AA at normal sizes).
- All text uppercase only for buttons and labels; the prompt and names keep normal case.
- Decorative texture (halftone, stripes, dot grid) stays low-contrast so it never competes with text.
