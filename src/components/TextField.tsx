import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { AlertIcon } from './icons'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  /** Red message under the field. */
  error?: string | null
  /** Small grey text under the field (hidden while there is an error). */
  hint?: string
  /** Mono, uppercase, wide letter spacing (room codes). */
  code?: boolean
}

/** Labelled 48px input with an error line. 16px text so iOS does not zoom. */
export function TextField({ label, error, hint, code, className, id, ...rest }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(
          'min-h-12 w-full rounded-chip border-2 bg-space px-4 text-cream',
          'placeholder:text-cream/40 focus:outline-none focus-visible:shadow-glow-orange',
          error ? 'border-red focus:border-red' : 'border-slate focus:border-orange',
          code
            ? 'font-mono text-2xl font-bold tracking-[0.4em] uppercase'
            : 'text-base',
        )}
        {...rest}
      />
      {error ? (
        <p id={msgId} role="alert" className="flex items-start gap-2 text-base text-red">
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-sm text-cream/60">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
