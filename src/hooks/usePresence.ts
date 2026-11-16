// Keeps my presence (online / onDisconnect) running while I am a player in the room.
import { useEffect, useRef } from 'react'
import type { Player } from '../lib/model'
import { startPresence } from '../lib/presence'

export function usePresence(
  code: string | null,
  uid: string | null,
  isPlayer: boolean,
  /** I came back after the grace period: my record is stale (see startPresence). */
  onExpired?: (player: Player) => void,
): void {
  const expired = useRef(onExpired)
  useEffect(() => {
    expired.current = onExpired
  })
  useEffect(() => {
    if (!code || !uid || !isPlayer) return
    return startPresence(code, uid, (p) => expired.current?.(p))
  }, [code, uid, isPlayer])
}
