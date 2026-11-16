// Runs an async action (usually a host transition) with a busy flag and an error toast.
import { useCallback, useState } from 'react'
import { useToast } from './useToast'

export function useAction() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async (fn: () => Promise<unknown>, error = 'Something went wrong. Check your connection.') => {
      setBusy(true)
      try {
        await fn()
      } catch (err) {
        console.warn('[game]', err)
        toast.show(error, 'error')
      } finally {
        setBusy(false)
      }
    },
    [toast],
  )
  return { busy, run }
}
