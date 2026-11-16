import { useContext } from 'react'
import { ToastContext, type ToastApi } from '../lib/toastContext'

/** Show a toast: `const toast = useToast(); toast.show('Hi', 'info')`. Needs <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
