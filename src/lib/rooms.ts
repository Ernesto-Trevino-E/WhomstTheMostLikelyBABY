// Create / join / leave a room.
import { get, runTransaction, serverTimestamp, set, update } from 'firebase/database'
import { ensureSignedIn } from './firebase'
import {
  DEFAULT_SETTINGS,
  NAME_MAX,
  ROOT,
  cleanName,
  dbRef,
  nameKey,
  paths,
  type Player,
  type RoomMeta,
  type RoomSettings,
} from './model'
import { drawNextRound } from './game'
import { getServerOffset, isRoomStale } from './presence'
import { generateCode, isValidCode, normalizeCode } from './roomCode'

export type RoomErrorCode =
  | 'INVALID_CODE'
  | 'ROOM_NOT_FOUND'
  | 'NAME_TAKEN'
  | 'NAME_INVALID'
  | 'CODE_EXHAUSTED'
  | 'KICKED'

const MESSAGES: Record<RoomErrorCode, string> = {
  INVALID_CODE: 'That code is not valid. Codes are 4 letters.',
  ROOM_NOT_FOUND: 'No open room with that code.',
  NAME_TAKEN: 'Someone in this room already has that name.',
  NAME_INVALID: `Names are 1–${NAME_MAX} characters.`,
  CODE_EXHAUSTED: 'Could not find a free room code. Try again.',
  KICKED: 'You were removed from this room.',
}

export class RoomError extends Error {
  readonly code: RoomErrorCode
  constructor(code: RoomErrorCode) {
    super(MESSAGES[code])
    this.code = code
    this.name = 'RoomError'
  }
}

export interface JoinResult {
  code: string
  uid: string
  joinNumber: number
  /** True when this tab was already a player in the room (reconnect). */
  rejoined: boolean
}

function validName(raw: string): string {
  const name = cleanName(raw)
  if (name.length < 1 || name.length > NAME_MAX) throw new RoomError('NAME_INVALID')
  return name
}

const MAX_CODE_ATTEMPTS = 8

export async function createRoom(rawName: string): Promise<JoinResult> {
  const name = validName(rawName)
  const { uid } = await ensureSignedIn()

  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateCode()
    // Claim the code: only commits if no room exists at this code.
    const result = await runTransaction(
      dbRef(paths.meta(code)),
      (current: RoomMeta | null) => {
        if (current !== null) return undefined
        return {
          createdAt: serverTimestamp(),
          hostUid: uid,
          phase: 'LOBBY',
          nextJoinNumber: 2,
          roundNumber: 0,
          lastScoredRound: 0,
        }
      },
      { applyLocally: false },
    )
    if (!result.committed) continue

    const room = `${ROOT}/${code}`
    const player: Record<keyof Player, unknown> = {
      name,
      joinNumber: 1,
      joinedAt: serverTimestamp(),
      joinedRound: 0,
      online: true,
      lastSeen: serverTimestamp(),
    }
    await update(dbRef(room), {
      settings: DEFAULT_SETTINGS,
      [`names/${nameKey(name)}`]: uid,
      [`players/${uid}`]: player,
      [`scores/${uid}`]: 0,
    })
    return { code, uid, joinNumber: 1, rejoined: false }
  }
  throw new RoomError('CODE_EXHAUSTED')
}

export async function joinRoom(rawCode: string, rawName: string): Promise<JoinResult> {
  const code = normalizeCode(rawCode)
  if (!isValidCode(code)) throw new RoomError('INVALID_CODE')
  const name = validName(rawName)
  const { uid } = await ensureSignedIn()

  const metaSnap = await get(dbRef(paths.meta(code)))
  if (!metaSnap.exists()) throw new RoomError('ROOM_NOT_FOUND')
  const meta = metaSnap.val() as RoomMeta

  const kicked = (await get(dbRef(paths.kicked(code)))).val() as Record<string, true> | null
  if (kicked?.[uid]) throw new RoomError('KICKED')

  const playersSnap = await get(dbRef(paths.players(code)))
  const players = (playersSnap.val() ?? {}) as Record<string, Player>

  // Same tab coming back: keep the original number.
  const existing = players[uid]
  if (existing) return { code, uid, joinNumber: existing.joinNumber, rejoined: true }

  const serverNow = Date.now() + (await getServerOffset())
  if (isRoomStale(players, serverNow, kicked)) throw new RoomError('ROOM_NOT_FOUND')

  // Lock the name (case-insensitive).
  const key = nameKey(name)
  const nameRes = await runTransaction(
    dbRef(paths.name(code, key)),
    (current: string | null) => (current === null || current === uid ? uid : undefined),
    { applyLocally: false },
  )
  if (!nameRes.committed) throw new RoomError('NAME_TAKEN')

  // Take the next join number.
  const numRes = await runTransaction(
    dbRef(`${paths.meta(code)}/nextJoinNumber`),
    (n: number | null) => (n ?? 1) + 1,
    { applyLocally: false },
  )
  const joinNumber = (numRes.snapshot.val() as number) - 1

  await update(dbRef(paths.room(code)), {
    [`players/${uid}`]: {
      name,
      joinNumber,
      joinedAt: serverTimestamp(),
      joinedRound: meta.roundNumber ?? 0,
      online: true,
      lastSeen: serverTimestamp(),
    },
    [`scores/${uid}`]: 0,
  })
  return { code, uid, joinNumber, rejoined: false }
}

/** Leave on purpose: removes my player, name lock and score. Host passes via presence.ts. */
export async function leaveRoom(code: string, uid: string, name: string): Promise<void> {
  await update(dbRef(paths.room(code)), {
    [`players/${uid}`]: null,
    [`names/${nameKey(name)}`]: null,
    [`scores/${uid}`]: null,
  })
}

/** Host only (rules check meta/hostUid). The kicked tab sees the flag and calls leaveRoom. */
export async function kickPlayer(code: string, uid: string): Promise<void> {
  await set(dbRef(`${paths.kicked(code)}/${uid}`), true)
}

export async function updateSettings(code: string, patch: Partial<RoomSettings>): Promise<void> {
  const flat: Record<string, unknown> = {}
  if (patch.allowSubmissions !== undefined) flat.allowSubmissions = patch.allowSubmissions
  for (const [cat, on] of Object.entries(patch.categories ?? {})) flat[`categories/${cat}`] = on
  await update(dbRef(paths.settings(code)), flat)
}

/** Host presses Start: draws the first prompt (see game.ts). */
export const startGame = (code: string) => drawNextRound(code)
