// Presence and the 30s grace period. There is no server, so every client derives the same
// answers from player records: `online` + `lastSeen` (set by onDisconnect) + server time.
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from './firebase'
import { GRACE_MS, dbRef, paths, type Player } from './model'

/**
 * Marks the player online while connected and registers onDisconnect to mark them offline.
 * Only call once the player record exists. Returns a cleanup that stops it.
 */
export function startPresence(code: string, uid: string): () => void {
  const playerRef = dbRef(paths.player(code, uid))
  const unsub = onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return
    onDisconnect(playerRef)
      .update({ online: false, lastSeen: serverTimestamp() })
      .then(() => update(playerRef, { online: true, lastSeen: serverTimestamp() }))
      .catch((err: unknown) => console.warn('[presence]', err))
  })
  return () => {
    unsub()
    onDisconnect(playerRef)
      .cancel()
      .catch(() => {})
  }
}

/** Left = offline for longer than the grace period. */
export function isLeft(player: Player, serverNow: number): boolean {
  return !player.online && serverNow - player.lastSeen > GRACE_MS
}

/** Offline but still inside the grace period (show "RECONNECTING..."). */
export function isReconnecting(player: Player, serverNow: number): boolean {
  return !player.online && !isLeft(player, serverNow)
}

type Kicked = Record<string, true> | null | undefined

/**
 * Players still in the room (online or within grace), sorted by join number. Kicked players
 * never count, even before their tab has removed its own record.
 */
export function activePlayers(
  players: Record<string, Player> | null | undefined,
  serverNow: number,
  kicked?: Kicked,
): [string, Player][] {
  return Object.entries(players ?? {})
    .filter(([uid, p]) => !isLeft(p, serverNow) && !kicked?.[uid])
    .sort(([, a], [, b]) => a.joinNumber - b.joinNumber)
}

/** The host everyone agrees on: the active player with the lowest join number. */
export function effectiveHost(
  players: Record<string, Player> | null | undefined,
  serverNow: number,
  kicked?: Kicked,
): string | null {
  return activePlayers(players, serverNow, kicked)[0]?.[0] ?? null
}

/** A room is stale (closed) when every player has left. */
export function isRoomStale(
  players: Record<string, Player> | null | undefined,
  serverNow: number,
  kicked?: Kicked,
): boolean {
  return activePlayers(players, serverNow, kicked).length === 0
}

/** If I am the effective host but meta says otherwise, take the host role. */
export async function claimHostIfNeeded(
  code: string,
  myUid: string,
  storedHostUid: string | undefined,
  players: Record<string, Player> | null | undefined,
  serverNow: number,
  kicked?: Kicked,
): Promise<boolean> {
  if (effectiveHost(players, serverNow, kicked) !== myUid || storedHostUid === myUid) return false
  await set(dbRef(`${paths.meta(code)}/hostUid`), myUid)
  return true
}

/** One-off read of the server clock offset (ms to add to Date.now()). */
export function getServerOffset(): Promise<number> {
  return new Promise((resolve) => {
    // onlyOnce: the cached value can fire synchronously, before an unsubscribe handle exists.
    onValue(ref(db, '.info/serverTimeOffset'), (snap) => resolve(Number(snap.val()) || 0), {
      onlyOnce: true,
    })
  })
}
