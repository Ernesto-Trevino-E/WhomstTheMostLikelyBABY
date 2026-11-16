// Data model for /whomst/rooms/{code} in the Realtime Database.
// Full description lives in the Phase 2 changelog entry. Rules: database.rules.json.
import { ref } from 'firebase/database'
import { db } from './firebase'

export const ROOT = 'whomst/rooms'
/** A disconnected player counts as "left" after this long. */
export const GRACE_MS = 30_000
export const MIN_PLAYERS = 4
export const NAME_MAX = 16
export const PROMPT_MAX = 80

export type Phase = 'LOBBY' | 'PROMPT' | 'VOTE' | 'REVEAL' | 'SCOREBOARD' | 'FINAL_RESULTS'
export type Category = 'chill' | 'cheeky' | 'harsh' | 'gotcha'
export const CATEGORIES: readonly Category[] = ['chill', 'cheeky', 'harsh', 'gotcha']

export interface RoomMeta {
  createdAt: number
  /** Stored host; clients re-claim it when the effective host changes (see presence.ts). */
  hostUid: string
  phase: Phase
  /** Join number the next player gets (host is 1). */
  nextJoinNumber: number
  /** 0 before the first round. */
  roundNumber: number
  /** Last round whose crowns were added to scores (guards double counting). */
  lastScoredRound?: number
}

export interface RoomSettings {
  allowSubmissions: boolean
  categories: Record<Category, boolean>
}

export interface Player {
  name: string
  joinNumber: number
  joinedAt: number
  /** meta.roundNumber at join time (late joiners sit out that round). */
  joinedRound: number
  online: boolean
  lastSeen: number
}

/** Player-submitted prompt. `text` is the ending only; the author is never shown. */
export interface SubmittedPrompt {
  text: string
  /** Normalised text for duplicate checks. */
  key: string
  authorUid: string
  used: boolean
  createdAt: number
}

export interface Round {
  number: number
  /** Stock id (e.g. "cheeky-012") or a submission push id. */
  promptId: string
  source: 'stock' | 'player'
  /** Copied in so every device shows the same prompt. */
  text: string
  startedAt: number
  /** Players allowed to vote this round. */
  eligible?: Record<string, true>
}

export interface Room {
  meta: RoomMeta
  settings?: RoomSettings
  players?: Record<string, Player>
  names?: Record<string, string>
  scores?: Record<string, number>
  prompts?: Record<string, SubmittedPrompt>
  drawn?: Record<string, true>
  round?: Round
  /** ballots/r{round}/{pushId} = targetUid. Never linked to the voter. */
  ballots?: Record<string, Record<string, string>>
  /** voted/r{round}/{uid} = true */
  voted?: Record<string, Record<string, true>>
}

export const DEFAULT_SETTINGS: RoomSettings = {
  allowSubmissions: true,
  categories: { chill: true, cheeky: true, harsh: true, gotcha: true },
}

// Paths (relative to the database root)
export const paths = {
  room: (code: string) => `${ROOT}/${code}`,
  meta: (code: string) => `${ROOT}/${code}/meta`,
  settings: (code: string) => `${ROOT}/${code}/settings`,
  players: (code: string) => `${ROOT}/${code}/players`,
  player: (code: string, uid: string) => `${ROOT}/${code}/players/${uid}`,
  name: (code: string, key: string) => `${ROOT}/${code}/names/${key}`,
  scores: (code: string) => `${ROOT}/${code}/scores`,
  round: (code: string) => `${ROOT}/${code}/round`,
  ballots: (code: string, round: number) => `${ROOT}/${code}/ballots/${roundKey(round)}`,
  voted: (code: string, round: number) => `${ROOT}/${code}/voted/${roundKey(round)}`,
}

/** "r3": a non-numeric key, so RTDB never turns ballots/voted into arrays. */
export const roundKey = (round: number) => `r${round}`

export const dbRef = (path: string) => ref(db, path)

/** Trim and collapse inner whitespace. */
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/** Case-insensitive key for the names/ lock, safe as an RTDB key (. # $ [ ] / encoded). */
export function nameKey(name: string): string {
  return encodeURIComponent(cleanName(name).toLowerCase()).replace(/\./g, '%2E')
}
