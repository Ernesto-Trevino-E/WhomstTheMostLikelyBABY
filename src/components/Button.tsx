import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** `sm` is visually smaller text/padding; the tap target stays at least 48px. */
  size?: 'md' | 'sm'
  fullWidth?: boolean
  icon?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-cream text-space border-[3px] border-orange hover:texture-halftone active:texture-halftone',
  secondary:
    'bg-slate text-cream border-2 border-cream hover:texture-stripes active:texture-stripes',
  danger:
    'bg-red text-cream border-2 border-red hover:texture-stripes active:texture-stripes',
  'danger-outline': 'bg-space text-red border-2 border-red hover:bg-red/10 active:bg-red/10',
  ghost: 'bg-transparent text-cream border-2 border-transparent hover:text-orange',
}

const sizes = {
  md: 'px-6 text-sm tracking-[0.18em]',
  sm: 'px-4 text-xs tracking-[0.15em]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 rounded-pill',
        'font-display font-bold uppercase select-none',
        'transition-[transform,color,background-color] duration-150 active:scale-[0.97]',
        'focus-visible:shadow-glow-orange focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        'disabled:hover:bg-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
