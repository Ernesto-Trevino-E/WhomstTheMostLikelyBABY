import { useId, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface SwitchProps {
  label: ReactNode
  /** Small text under the label (e.g. "30 prompts"). */
  detail?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** Full-row toggle (48px+ tap target) with an orange track when on. */
export function Switch({ label, detail, checked, onChange, disabled }: SwitchProps) {
  const id = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 rounded-chip px-2 py-2 text-left',
        'focus-visible:shadow-glow-orange focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <span id={id} className="flex min-w-0 flex-col">
        <span className="text-base font-bold text-cream">{label}</span>
        {detail && <span className="text-sm text-cream/60">{detail}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border-2 transition-colors duration-150',
          checked ? 'border-orange bg-orange' : 'border-slate bg-space',
        )}
      >
        <span
          className={cn(
            'absolute size-5 rounded-pill transition-[left] duration-150 motion-reduce:transition-none',
            checked ? 'left-[1.375rem] bg-cream' : 'left-0.5 bg-slate',
          )}
        />
      </span>
    </button>
  )
}
