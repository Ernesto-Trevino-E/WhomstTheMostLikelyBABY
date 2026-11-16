// Generic live listener for one database path. Pass null to listen to nothing.
import { useEffect, useState } from 'react'
import { onValue } from 'firebase/database'
import { dbRef } from '../lib/model'

export interface DbValue<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useDbValue<T>(path: string | null): DbValue<T> {
  const [state, setState] = useState<DbValue<T> & { path: string | null }>({
    path,
    data: null,
    loading: path !== null,
    error: null,
  })

  useEffect(() => {
    if (path === null) return
    return onValue(
      dbRef(path),
      (snap) => setState({ path, data: (snap.val() as T) ?? null, loading: false, error: null }),
      (error) => setState({ path, data: null, loading: false, error }),
    )
  }, [path])

  // Never return a previous path's data while the new listener warms up.
  if (state.path !== path) return { data: null, loading: path !== null, error: null }
  return { data: state.data, loading: state.loading, error: state.error }
}
