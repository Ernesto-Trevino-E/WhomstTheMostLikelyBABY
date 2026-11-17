import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  TOAST_DURATION_MS,
  ToastContext,
  type ToastApi,
  type ToastItem,
  type ToastType,
} from '../lib/toastContext'
import { playError } from '../lib/sound'
import { Toast } from './Toast'

/** Provides `useToast()` and renders the toast stack at the top of the screen. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => window.clearTimeout(t))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (type === 'error') playError()
    const id = nextId.current++
    setToasts((list) => [...list, { id, message, type }])
    const t = window.setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id))
      timers.current.delete(id)
    }, TOAST_DURATION_MS)
    timers.current.set(id, t)
  }, [])

  const api = useMemo<ToastApi>(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      >
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
