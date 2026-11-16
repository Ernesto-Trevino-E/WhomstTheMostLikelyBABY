// Presence and the 30s grace period. There is no server, so every client derives the same
// answers from player records: `online` + `lastSeen` (set by onDisconnect) + server time.
import {
  get,
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from './firebase'
import { GRACE_MS, dbRef, nameKey, paths, type Player } from './model'

/**
 * Marks the player online while connected and registers onDisconnect to mark them offline.
 * Only call once the player record exists. Returns a cleanup that stops it.
 *
 * On every (re)connect the record is read first: if I was away longer than the grace period
 * I already count as "left", so the record is not revived and `onExpired` runs instead
 * (the caller removes it and the player rejoins as a new player).
 */
export function startPresence(
  code: string,
  uid: string,
  onExpired?: (player: Player) => void,
): () => void {
  const playerRef = dbRef(paths.player(code, uid))
  let stopped = false
  const unsub = onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return
    void (async () => {
      const [record, offset] = await Promise.all([get(playerRef), getServerOffset()])
      if (stopped) return
      const player = record.val() as Player | null
      if (!player) return // pruned while I was away: Room shows the Join form
      if (isLeft(player, Date.now() + offset)) {
        onExpired?.(player)
        return
      }
      await onDisconnect(playerRef).update({ online: false, lastSeen: serverTimestamp() })
      await update(playerRef, { online: true, lastSeen: serverTimestamp() })
    })().catch((err: unknown) => console.warn('[presence]', err))
  })
  return () => {
    stopped = true
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

/** Players offline for longer than the grace period. */
export function leftPlayers(
  players: Record<string, Player> | null | undefined,
  serverNow: number,
): [string, Player][] {
  return Object.entries(players ?? {}).filter(([, p]) => isLeft(p, serverNow))
}

/**
 * Remove the records of players who left (player, name lock, score) in one write. Rules
 * allow anyone to delete a player record that has been offline for more than 30s.
 */
export async function pruneLeftPlayers(
  code: string,
  players: Record<string, Player> | null | undefined,
  serverNow: number,
): Promise<number> {
  const gone = leftPlayers(players, serverNow)
  if (gone.length === 0) return 0
  const writes: Record<string, null> = {}
  for (const [uid, p] of gone) {
    writes[`players/${uid}`] = null
    writes[`names/${nameKey(p.name)}`] = null
    writes[`scores/${uid}`] = null
  }
  await update(dbRef(paths.room(code)), writes)
  return gone.length
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
