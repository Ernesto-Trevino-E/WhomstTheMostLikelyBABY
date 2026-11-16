import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { InfoIcon, SignalIcon } from './icons'

export interface BannerProps {
  /** `info` = sage outline (late joiner). `alert` = red (you are reconnecting). */
  type?: 'info' | 'alert'
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Banner({ type = 'info', icon, children, className }: BannerProps) {
  const defaultIcon =
    type === 'info' ? <InfoIcon size={20} /> : <SignalIcon size={20} className="animate-signal" />
  return (
    <div
      role={type === 'alert' ? 'alert' : 'status'}
      className={cn(
        'flex w-full items-start gap-3 rounded-chip border-2 px-4 py-3 text-base',
        type === 'info'
          ? 'border-sage bg-sage/10 text-cream'
          : 'border-red bg-red text-cream texture-stripes',
        className,
      )}
    >
      <span className={cn('mt-0.5 shrink-0', type === 'info' ? 'text-sage' : 'text-cream')}>
        {icon ?? defaultIcon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
