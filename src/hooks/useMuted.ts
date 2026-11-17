import { useSyncExternalStore } from 'react'
import { isMuted, setMuted, subscribeMuted } from '../lib/sound'

/** The persisted mute choice and a toggle. */
export function useMuted(): [boolean, () => void] {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false)
  return [muted, () => setMuted(!isMuted())]
}
