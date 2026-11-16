// Signs in anonymously on first use and returns the uid.
import { useEffect, useState } from 'react'
import { ensureSignedIn } from '../lib/firebase'

export function useAuth(): { uid: string | null; error: Error | null } {
  const [uid, setUid] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let alive = true
    ensureSignedIn()
      .then((user) => alive && setUid(user.uid))
      .catch((err: unknown) => alive && setError(err instanceof Error ? err : new Error(String(err))))
    return () => {
      alive = false
    }
  }, [])

  return { uid, error }
}
