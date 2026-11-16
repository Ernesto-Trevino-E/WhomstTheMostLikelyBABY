// Am I connected to the Realtime Database? Only reports "lost" after a connection was made
// at least once, so the page doesn't flash a reconnecting banner while it loads.
import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../lib/firebase'

export function useConnectionLost(): boolean {
  const [state, setState] = useState({ seen: false, connected: false })
  useEffect(
    () =>
      onValue(ref(db, '.info/connected'), (snap) => {
        const connected = snap.val() === true
        setState((s) => ({ seen: s.seen || connected, connected }))
      }),
    [],
  )
  return state.seen && !state.connected
}
