# WhomstTheMostBABY — Game Flow

How a session runs, from opening the app to the end of the game. Tech choices (hosting, DB, real-time) are tracked in `00-project-overview.md` and are not decided here.

## Core Idea
A "Who's most likely to..." party game. Each round shows a prompt, everyone votes for a player in the room, and the votes are revealed. The game is endless and the host decides when it stops.

---

## 1. Pre-Game

### 1.1 Landing screen
Two actions: **Create Room** and **Join Room**.

### 1.2 Create Room
1. The player enters a display name.
2. The server generates a **random room code** (short, easy to read aloud, e.g. 4–5 uppercase letters, avoiding look-alike characters such as O/0 and I/1).
3. That player becomes the **host** and is taken to the lobby.

### 1.3 Join Room
1. The player enters a room code and a display name.
2. Validation:
   - The code exists and the room is open.
   - The display name is not already taken in that room.
   - Joining is allowed at any time, including after the game has started (see Late joiners below).
3. On success the player enters the lobby. On failure they see a clear error message.

### 1.4 Lobby
- Shows the room code (with a copy/share button) and the list of connected players, updating live.
- **Host controls:**
  - Start the game (enabled only once **at least 4 players** are in the lobby).
  - Kick a player (optional).
  - Manage the prompt pool (see 1.5).
- Non-host players see a "Waiting for host to start..." state.

### 1.5 Prompt setup
- Every prompt is stored as **only the ending** (e.g. "fall asleep at a party"). The app always adds the fixed lead-in **"Who's most likely to"** when it shows a prompt, so players never type or see the lead-in in the deck or the submission form.
- The game ships with a **built-in (stock) deck**. The draft list lives in `04-prompt-deck.md`. Each stock prompt has a **category**: Chill, Cheeky, Harsh or Gotcha.
- The host **filters by category** (all on by default) in the lobby's Prompts modal. The filter applies to stock prompts only, and the host can change it between rounds.
- Players may **submit their own prompts**, in the lobby **and during the game** (see 2, Vote phase). Submissions are anonymous (the author is never shown) and have no category, so the category filter never hides them.
- **Draw order:** unused player-submitted prompts come first (shuffled), then stock prompts that pass the category filter (shuffled, no repeats). When everything has been used, the whole pool is reshuffled and reused.
- Submitted prompts live only in the room and are deleted with it (nothing persists).
- The host can toggle whether player submissions are allowed (optional).
- Suggested limits (Claude Code confirms in plan mode): about 80 characters, trimmed, a small cap per player (about 5 waiting at once), and case-insensitive duplicates of waiting or already-used prompts are rejected.

### 1.6 Start condition
- The host presses **Start**.
- Minimum players: **4**. Maximum players: **no limit**.
- Players can still join after the game starts (see Late joiners in section 2).

---

## 2. Game Cycle (repeats until the host ends the game)

Each round has four phases:

| Phase | What happens |
|---|---|
| **1. Prompt** | A prompt is drawn following the draw order in 1.5 (unused player submissions first, then filtered stock prompts, no repeats until the whole pool is used) and shown to everyone as "Who's most likely to <ending>", e.g. "Who's most likely to fall asleep at a party?" |
| **2. Vote** | Every player votes for one player in the room, **including themselves**. There is no timer. Voting ends when **everyone has voted**, or when the **host ends voting early** (players who haven't voted simply don't count). The Vote screen also has a small **Add a prompt** button: it opens a modal where any player (including one sitting out) can type an ending and submit it, then returns to voting with their selection untouched. A prompt submitted mid-round never changes the current round; it enters the pool for later draws. |
| **3. Reveal** | Results show the **vote distribution** (how many votes each player got). Voting is **fully anonymous**: it is never shown who voted for whom. The player with the most votes is **crowned** for that round. |
| **4. Scoreboard** | A running tally of crowns per player is shown. The **host manually advances** to the next round by pressing **Next Round** (no auto-advance). |

### Late joiners
- Players can join at any time, including mid-game.
- A player who joins during a Vote or Reveal phase **sits that round out**: they can watch but not vote.
- They become full participants (can vote and be voted for) when the **next prompt** is shown.
- They start with 0 crowns.

### Ties
If two or more players tie for most votes, all of them are crowned.

### Ending the game
- The game is **endless**. The host can press **End Game** at any time (between rounds).
- On end, a **final results screen** shows the leaderboard (most crowns) and optional highlights.
- Players then choose **Play Again** (back to the lobby with the same room and players) or **Leave**.

---

## 3. Edge Cases

| Situation | Proposed behavior |
|---|---|
| Player disconnects mid-round | They are not waited on for votes. If they reconnect within the **grace period** (about 30 seconds), they simply continue and keep their player number. Once the grace period passes they count as "left" (which can trigger host passing or room deletion). They can still rejoin with the room code afterwards, as a new player. |
| Host leaves or disconnects | Players are **numbered in the order they join** (host = 1). When the host leaves, the host role **passes to the next player in that order**. The new host gets the host controls (start, end voting, next round, end game). No time tracking is needed. If the room is empty, it closes. |
| Late join | Allowed anytime; the player sits out the current round and joins in at the next prompt (see Late joiners). |
| Prompt pool runs out | Reshuffle the full pool and continue. |
| Fewer than 4 players mid-game | The game ends and everyone goes **back to the lobby**. They can wait there for new players to join, or the lobby can be closed. |
| Room lifetime | There is no timer. When **all players have left**, the session ends and the room is **deleted**. Nothing is saved: no history, accounts or scores persist after cleanup. |

---

## 4. Simple State Model

```
LOBBY → (host starts) → PROMPT → VOTE → REVEAL → SCOREBOARD → PROMPT → ...
                                                      ↓
                                              (host ends) → FINAL_RESULTS → LOBBY or LEAVE
```

---

## 5. Decisions Made
- [x] Minimum players: 4 to start.
- [x] No vote timer. Voting ends when everyone has voted, or the host ends it early.
- [x] Players can vote for themselves.
- [x] Voting is anonymous; only the vote distribution is shown.
- [x] Late joins allowed; they sit out the current round and vote from the next prompt.
- [x] Host manually advances to the next round.
- [x] Rooms are deleted once all players have left (no expiry timer); nothing is persisted.
- [x] If the room drops below 4 players mid-game, return to the lobby to wait for more players, or close the lobby.
- [x] Host succession: players are numbered in join order and the role passes to the next number (no time tracking).
- [x] A returning original host rejoins as a regular player (the next numbered player) and does not get the host role back.
- [x] Database: Firebase **Realtime Database** (part of Firebase, so the existing Firebase project can be used). Its disconnect detection (`onDisconnect`) drives presence, host passing and empty-room cleanup.
- [x] A **grace period of about 30 seconds** applies before a disconnected player counts as "left", so a flaky connection doesn't trigger host passing or room deletion.
- [x] A player who reconnects within the grace period keeps their original number.
- [x] No maximum number of players per room.
- [x] Real-time: **Firebase** (live listeners for lobby and vote updates).
- [x] If the host leaves or disconnects, the host role moves to another player.
- [x] Prompts store only the ending; the app adds "Who's most likely to" (decided 2026-11-16).
- [x] Draw order: unused player-submitted prompts first, then stock prompts, then reshuffle everything (2026-11-16).
- [x] Stock prompts have categories (Chill, Cheeky, Harsh, Gotcha) and the host can filter them; player submissions are uncategorised and always included (2026-11-16).
- [x] Player submissions vanish with the room; they are never saved (2026-11-16).
- [x] Players can submit prompts in the lobby and mid-game via an "Add a prompt" button on the Vote screen (2026-11-16).
- [x] Tone: aimed at adult friends, mostly cheeky with some harsh and "gotcha" prompts; nothing explicit (2026-11-16).

## 6. Open Questions
- None at the moment. Remaining details (frontend framework, hosting) are tracked in `00-project-overview.md`.
