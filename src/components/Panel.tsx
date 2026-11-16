import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type PanelTone = 'slate' | 'sage' | 'red' | 'orange' | 'gold' | 'cream'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** `double` adds an inner line inside the outline (used for the prompt and room code). */
  variant?: 'single' | 'double'
  /** Outline color. `gold` is reserved for the crown/winner treatment. */
  tone?: PanelTone
  padded?: boolean
}

const tones: Record<PanelTone, { border: string; inner: string }> = {
  slate: { border: 'border-slate', inner: 'before:border-slate/60' },
  sage: { border: 'border-sage', inner: 'before:border-sage/50' },
  red: { border: 'border-red', inner: 'before:border-red/50' },
  orange: { border: 'border-orange', inner: 'before:border-orange/50' },
  gold: { border: 'border-gold', inner: 'before:border-gold/50' },
  cream: { border: 'border-cream', inner: 'before:border-cream/50' },
}

export function Panel({
  variant = 'single',
  tone = 'slate',
  padded = true,
  className,
  children,
  ...rest
}: PanelProps) {
  const t = tones[tone]
  return (
    <div
      className={cn(
        'relative rounded-panel border-2 bg-panel',
        t.border,
        padded && (variant === 'double' ? 'p-5 sm:p-7' : 'p-4 sm:p-6'),
        variant === 'double' &&
          cn(
            'before:pointer-events-none before:absolute before:inset-1.5 before:rounded-[0.875rem]',
            'before:border before:content-[""]',
            t.inner,
          ),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
