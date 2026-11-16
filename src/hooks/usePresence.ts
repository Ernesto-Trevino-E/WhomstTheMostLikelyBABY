// Keeps my presence (online / onDisconnect) running while I am a player in the room.
import { useEffect } from 'react'
import { startPresence } from '../lib/presence'

export function usePresence(code: string | null, uid: string | null, isPlayer: boolean): void {
  useEffect(() => {
    if (!code || !uid || !isPlayer) return
    return startPresence(code, uid)
  }, [code, uid, isPlayer])
}
