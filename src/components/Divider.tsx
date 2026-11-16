import { cn } from '../lib/cn'

export interface DividerProps {
  label?: string
  tone?: 'sage' | 'slate'
  style?: 'dotted' | 'dashed'
  className?: string
}

/** Dotted/dashed ruler line, optionally with a label on the left ("PLAYERS (5)"). */
export function Divider({ label, tone = 'sage', style = 'dotted', className }: DividerProps) {
  const line = cn(
    'h-0 flex-1 border-t-2',
    style === 'dotted' ? 'border-dotted' : 'border-dashed',
    tone === 'sage' ? 'border-sage/70' : 'border-slate',
  )
  if (!label) return <hr className={cn(line, 'w-full border-x-0 border-b-0', className)} />
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator">
      <span
        className={cn(
          'font-display text-xs font-bold tracking-[0.2em] uppercase',
          tone === 'sage' ? 'text-sage' : 'text-cream/60',
        )}
      >
        {label}
      </span>
      <span aria-hidden className={line} />
    </div>
  )
}
