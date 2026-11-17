import { cn } from '../lib/cn'
import { SpeakerIcon, SpeakerOffIcon } from './icons'

export interface MuteToggleProps {
  muted: boolean
  onToggle: () => void
  className?: string
}

/** Small icon button for sound on/off. Controlled; App wires it to the persisted mute store. */
export function MuteToggle({ muted, onToggle, className }: MuteToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      className={cn(
        'inline-flex size-12 cursor-pointer items-center justify-center rounded-pill border-2 bg-panel',
        'transition-colors focus-visible:shadow-glow-orange focus-visible:outline-none',
        muted ? 'border-slate text-cream/60' : 'border-cream text-cream',
        className,
      )}
    >
      {muted ? <SpeakerOffIcon /> : <SpeakerIcon />}
    </button>
  )
}
