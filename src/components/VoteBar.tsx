import { cn } from '../lib/cn'

export interface VoteBarProps {
  value: number
  max: number
  /** Gold fill for the crowned row(s). */
  crowned?: boolean
  showCount?: boolean
  label?: string
  className?: string
}

/** Progress bar with a knob at the fill end: slate track, orange fill, gold when crowned. */
export function VoteBar({ value, max, crowned, showCount = true, label, className }: VoteBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="meter"
        aria-label={label ?? 'Votes'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative h-4 flex-1 rounded-pill border-2 border-slate bg-space"
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-pill transition-[width] duration-500 ease-out',
            crowned ? 'bg-gold' : 'bg-orange',
          )}
          style={{ width: `${pct}%` }}
        />
        {/* Knob */}
        <div
          aria-hidden
          className={cn(
            'absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-pill border-[3px] border-space transition-[left] duration-500 ease-out',
            crowned ? 'bg-gold' : value > 0 ? 'bg-cream' : 'bg-slate',
          )}
          style={{ left: `clamp(8px, ${pct}%, calc(100% - 8px))` }}
        />
      </div>
      {showCount && (
        <span
          className={cn(
            'w-8 text-right font-mono text-lg font-bold',
            crowned ? 'text-gold' : 'text-cream',
          )}
        >
          {value}
        </span>
      )}
    </div>
  )
}
