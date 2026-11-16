import { cn } from '../lib/cn'
import { CrownIcon } from './icons'

export interface CrownBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  /** Shows "x3" next to the crown when set. */
  count?: number
  glow?: boolean
  className?: string
}

const px = { sm: 16, md: 24, lg: 40 }

/** Gold crown with glow. Gold is reserved for crowns and winners. */
export function CrownBadge({ size = 'md', count, glow = true, className }: CrownBadgeProps) {
  const label = count !== undefined ? `${count} crown${count === 1 ? '' : 's'}` : 'Crowned'
  return (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex items-center gap-1 text-gold', className)}
    >
      <CrownIcon
        size={px[size]}
        className={cn(glow && 'drop-shadow-[0_0_6px_rgb(242_182_94_/_0.75)]')}
      />
      {count !== undefined && (
        <span className="font-mono text-sm font-bold" aria-hidden>
          x{count}
        </span>
      )}
    </span>
  )
}
