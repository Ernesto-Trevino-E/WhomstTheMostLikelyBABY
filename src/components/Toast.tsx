import { cn } from '../lib/cn'
import type { ToastType } from '../lib/toastContext'
import { AlertIcon, InfoIcon } from './icons'

export interface ToastProps {
  message: string
  type?: ToastType
}

/** Small pill shown at the top of the screen. Usually rendered by <ToastProvider>. */
export function Toast({ message, type = 'info' }: ToastProps) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto inline-flex max-w-full animate-toast-in items-center gap-2 rounded-pill px-4 py-2.5',
        'font-body text-base font-bold text-space',
        type === 'info' ? 'bg-sage' : 'bg-red text-cream shadow-glow-red',
      )}
    >
      {type === 'error' ? <AlertIcon size={18} /> : <InfoIcon size={18} />}
      <span className="min-w-0">{message}</span>
    </div>
  )
}
