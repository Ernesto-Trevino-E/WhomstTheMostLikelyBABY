// Server-corrected clock that ticks every second (drives the grace period).
import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../lib/firebase'

export function useServerNow(tickMs = 1000): number {
  const [offset, setOffset] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(
    () => onValue(ref(db, '.info/serverTimeOffset'), (snap) => setOffset(Number(snap.val()) || 0)),
    [],
  )
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs)
    return () => window.clearInterval(id)
  }, [tickMs])

  return now + offset
}
