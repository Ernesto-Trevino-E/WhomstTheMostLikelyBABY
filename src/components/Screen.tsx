import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/** Phone-width single column used by every real screen. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 px-4 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {children}
    </main>
  )
}

/** "Waiting for host..." with the pulsing dot row. */
export function WaitingRow({ label = 'Waiting for host' }: { label?: string }) {
  return (
    <p
      role="status"
      className="flex min-h-12 items-center justify-center gap-3 font-display text-sm font-bold tracking-[0.15em] text-cream/80 uppercase"
    >
      {label}
      <span className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-pill bg-sage animate-pulse-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </p>
  )
}
