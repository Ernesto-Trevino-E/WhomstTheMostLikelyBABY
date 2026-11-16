import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { initials, playerColor } from '../lib/players'
import { SignalIcon } from './icons'
import { CrownBadge } from './CrownBadge'

export interface PlayerChipProps {
  name: string
  /** 1-based join number; picks the player color. */
  joinNumber: number
  isHost?: boolean
  isYou?: boolean
  /** Red ring plus "RECONNECTING..." badge. */
  disconnected?: boolean
  crowned?: boolean
  dimmed?: boolean
  /** Show "#n" join-order number before the avatar. */
  showNumber?: boolean
  size?: 'md' | 'lg'
  /** Right-side slot (e.g. kick button, crown count). */
  trailing?: ReactNode
  className?: string
}

export function PlayerAvatar({
  name,
  joinNumber,
  disconnected,
  crowned,
  size = 'md',
}: Pick<PlayerChipProps, 'name' | 'joinNumber' | 'disconnected' | 'crowned' | 'size'>) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill font-display font-black text-space',
        size === 'lg' ? 'size-14 text-lg' : 'size-11 text-sm',
        disconnected && 'opacity-60 ring-[3px] ring-red ring-offset-2 ring-offset-panel',
        crowned && !disconnected && 'ring-[3px] ring-gold ring-offset-2 ring-offset-panel',
      )}
      style={{ backgroundColor: playerColor(joinNumber) }}
    >
      {initials(name)}
    </span>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-display text-[0.625rem] leading-4 font-bold tracking-[0.15em] uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PlayerChip({
  name,
  joinNumber,
  isHost,
  isYou,
  disconnected,
  crowned,
  dimmed,
  showNumber,
  size = 'md',
  trailing,
  className,
}: PlayerChipProps) {
  return (
    <div
      className={cn(
        'flex min-h-12 min-w-0 items-center gap-3 transition-opacity',
        dimmed && 'opacity-60',
        className,
      )}
    >
      {showNumber && (
        <span className="w-6 shrink-0 text-right font-mono text-sm font-bold text-cream/60">
          {joinNumber}
        </span>
      )}
      <PlayerAvatar
        name={name}
        joinNumber={joinNumber}
        disconnected={disconnected}
        crowned={crowned}
        size={size}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={cn(
            'truncate font-body font-bold',
            size === 'lg' ? 'text-lg' : 'text-base',
            crowned ? 'text-gold' : 'text-cream',
          )}
          title={name}
        >
          {name}
        </span>
        {(isHost || isYou || disconnected || crowned) && (
          <span className="flex flex-wrap items-center gap-1.5">
            {crowned && <CrownBadge size="sm" />}
            {isHost && <Badge className="bg-sage text-space">Host</Badge>}
            {isYou && <Badge className="border border-cream/60 text-cream">You</Badge>}
            {disconnected && (
              <Badge className="border border-red text-red">
                <SignalIcon size={12} className="animate-signal" />
                Reconnecting...
              </Badge>
            )}
          </span>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center">{trailing}</div>}
    </div>
  )
}
