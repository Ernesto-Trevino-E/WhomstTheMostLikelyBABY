// Game loop: prompt draw and phase transitions. The effective host's tab runs these.
// Each transition first moves `meta` inside a transaction guarded by the expected phase and
// round, so a double tap or two tabs that both think they are host can't run it twice.
import { get, increment, runTransaction, serverTimestamp, update } from 'firebase/database'
import { STOCK_PROMPTS } from '../data/prompts'
import {
  DEFAULT_SETTINGS,
  dbRef,
  paths,
  type Phase,
  type Player,
  type RoomMeta,
  type RoomSettings,
  type SubmittedPrompt,
} from './model'
import { activePlayers, getServerOffset } from './presence'
import { tally } from './votes'

export interface PromptPick {
  id: string
  source: 'stock' | 'player'
  text: string
  /** True when the cycle was used up and `drawn` starts over. */
  reshuffle: boolean
}

const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

/**
 * Draw order (01-game-flow.md 1.5):
 * 1. unused player submissions;
 * 2. else this cycle's pool (category-filtered stock + already-played submissions) minus `drawn`;
 * 3. else reshuffle: the whole pool again, avoiding the prompt just played when possible.
 */
export function pickPrompt(
  prompts: Record<string, SubmittedPrompt> | null | undefined,
  drawn: Record<string, true> | null | undefined,
  settings: RoomSettings | null | undefined,
  lastPromptId?: string,
): PromptPick | null {
  const subs = Object.entries(prompts ?? {})
  const fresh = subs.filter(([, p]) => !p.used)
  if (fresh.length > 0) {
    const [id, p] = randomItem(fresh)
    return { id, source: 'player', text: p.text, reshuffle: false }
  }

  const cats = { ...DEFAULT_SETTINGS.categories, ...settings?.categories }
  const pool: Omit<PromptPick, 'reshuffle'>[] = [
    ...STOCK_PROMPTS.filter((p) => cats[p.category]).map((p) => ({
      id: p.id,
      source: 'stock' as const,
      text: p.text,
    })),
    ...subs.map(([id, p]) => ({ id, source: 'player' as const, text: p.text })),
  ]
  if (pool.length === 0) return null

  const left = pool.filter((p) => !drawn?.[p.id])
  if (left.length > 0) return { ...randomItem(left), reshuffle: false }

  const again = pool.length > 1 ? pool.filter((p) => p.id !== lastPromptId) : pool
  return { ...randomItem(again), reshuffle: true }
}

/** All players tied for the most votes; nobody when there are no votes. */
export function crownedUids(counts: Record<string, number> | null | undefined): string[] {
  const entries = Object.entries(counts ?? {})
  const max = Math.max(0, ...entries.map(([, n]) => n))
  if (max === 0) return []
  return entries.filter(([, n]) => n === max).map(([uid]) => uid)
}

/**
 * Move meta from one phase to another for round `round` (one atomic write). Returns true
 * if this call did it.
 */
async function transition(
  code: string,
  from: Phase[],
  round: number,
  next: (meta: RoomMeta) => Partial<RoomMeta>,
): Promise<boolean> {
  const res = await runTransaction(
    dbRef(paths.meta(code)),
    (meta: RoomMeta | null) => {
      if (!meta || !from.includes(meta.phase) || meta.roundNumber !== round) return undefined
      return { ...meta, ...next(meta) }
    },
    { applyLocally: false },
  )
  return res.committed
}

/** Host: Start (from the lobby) or Next Round (from the scoreboard). Draws the next prompt. */
export async function drawNextRound(code: string): Promise<boolean> {
  const [metaSnap, promptsSnap, drawnSnap, settingsSnap, playersSnap, kickedSnap, roundSnap] =
    await Promise.all([
      get(dbRef(paths.meta(code))),
      get(dbRef(paths.prompts(code))),
      get(dbRef(paths.drawn(code))),
      get(dbRef(paths.settings(code))),
      get(dbRef(paths.players(code))),
      get(dbRef(paths.kicked(code))),
      get(dbRef(`${paths.round(code)}/promptId`)),
    ])
  const meta = metaSnap.val() as RoomMeta | null
  if (!meta) return false
  const prompts = promptsSnap.val() as Record<string, SubmittedPrompt> | null
  const pick = pickPrompt(
    prompts,
    drawnSnap.val() as Record<string, true> | null,
    settingsSnap.val() as RoomSettings | null,
    (roundSnap.val() as string | null) ?? undefined,
  )
  if (!pick) throw new Error('No prompts available')

  const serverNow = Date.now() + (await getServerOffset())
  const players = playersSnap.val() as Record<string, Player> | null
  const kicked = kickedSnap.val() as Record<string, true> | null
  const eligible = Object.fromEntries(
    activePlayers(players, serverNow, kicked).map(([uid]) => [uid, true as const]),
  )

  const n = meta.roundNumber + 1
  const ok = await transition(code, ['LOBBY', 'SCOREBOARD'], meta.roundNumber, () => ({
    phase: 'PROMPT',
    roundNumber: n,
  }))
  if (!ok) return false

  const writes: Record<string, unknown> = {
    round: {
      number: n,
      promptId: pick.id,
      source: pick.source,
      text: pick.text,
      startedAt: serverTimestamp(),
      eligible,
    },
  }
  if (pick.reshuffle) writes.drawn = { [pick.id]: true }
  else writes[`drawn/${pick.id}`] = true
  if (pick.source === 'player' && prompts?.[pick.id]) writes[`prompts/${pick.id}/used`] = true
  await update(dbRef(paths.room(code)), writes)
  return true
}

/** Host: Prompt -> Vote. */
export const startVoting = (code: string, round: number) =>
  transition(code, ['PROMPT'], round, () => ({ phase: 'VOTE' }))

/**
 * Vote -> Reveal (everyone voted, or the host ended voting early). The tab that wins the
 * transaction freezes the tally into the round and adds one crown per top player, once.
 */
export async function endVoting(code: string, round: number): Promise<boolean> {
  const ok = await transition(code, ['VOTE'], round, () => ({
    phase: 'REVEAL',
    lastScoredRound: round,
  }))
  if (!ok) return false
  const ballots = (await get(dbRef(paths.ballots(code, round)))).val() as Record<string, string> | null
  const counts = tally(ballots)
  const writes: Record<string, unknown> = {}
  for (const [uid, n] of Object.entries(counts)) writes[`round/tally/${uid}`] = n
  for (const uid of crownedUids(counts)) writes[`scores/${uid}`] = increment(1)
  if (Object.keys(writes).length > 0) await update(dbRef(paths.room(code)), writes)
  return true
}

/** Host: Reveal -> Scoreboard. */
export const showScores = (code: string, round: number) =>
  transition(code, ['REVEAL'], round, () => ({ phase: 'SCOREBOARD' }))

/** Host: Scoreboard -> Final results (Phase 4 shows a simple placeholder). */
export const endGame = (code: string, round: number) =>
  transition(code, ['SCOREBOARD'], round, () => ({ phase: 'FINAL_RESULTS' }))

/** Host: Final results -> Lobby (scores are kept until Phase 5 adds Play Again). */
export const backToLobby = (code: string, round: number) =>
  transition(code, ['FINAL_RESULTS'], round, () => ({ phase: 'LOBBY' }))


/** This round's voters and vote options: eligible players still in the room, by join number. */
export function eligiblePlayers(
  round: { eligible?: Record<string, true> } | null | undefined,
  players: Record<string, Player> | null | undefined,
  serverNow: number,
  kicked?: Record<string, true> | null,
): [string, Player][] {
  return activePlayers(players, serverNow, kicked).filter(([uid]) => round?.eligible?.[uid])
}
