import { cn } from '../lib/cn'
import { PlayerAvatar, Badge } from './PlayerChip'

export interface VoteCardProps {
  name: string
  joinNumber: number
  isYou?: boolean
  selected?: boolean
  disabled?: boolean
  onSelect?: () => void
}

/** Tappable player card for the Vote grid (2 columns on phones). */
export function VoteCard({ name, joinNumber, isYou, selected, disabled, onSelect }: VoteCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-panel bg-panel p-3 text-center',
        'transition-[transform,opacity,border-color] duration-150 active:scale-[0.97]',
        'focus-visible:shadow-glow-orange focus-visible:outline-none',
        selected ? 'border-[3px] border-orange shadow-glow-orange' : 'border-2 border-slate',
        disabled && 'cursor-not-allowed opacity-40 active:scale-100',
      )}
    >
      <PlayerAvatar name={name} joinNumber={joinNumber} size="lg" />
      <span className="w-full truncate font-body text-base font-bold text-cream" title={name}>
        {name}
      </span>
      {isYou && <Badge className="border border-cream/60 text-cream">You</Badge>}
    </button>
  )
}
