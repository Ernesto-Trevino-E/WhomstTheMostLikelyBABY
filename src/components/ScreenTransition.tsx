import type { ReactNode } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { cn } from '../lib/cn'

export interface ScreenTransitionProps {
  /** Change this to replay the enter animation (e.g. the current phase or screen name). */
  screenKey: string
  children: ReactNode
  className?: string
}

/** 180ms fade + slight upward slide on each screen change; instant with reduced motion. */
export function ScreenTransition({ screenKey, children, className }: ScreenTransitionProps) {
  const reduced = usePrefersReducedMotion()
  return (
    <div key={screenKey} className={cn(!reduced && 'animate-screen-in', className)}>
      {children}
    </div>
  )
}
