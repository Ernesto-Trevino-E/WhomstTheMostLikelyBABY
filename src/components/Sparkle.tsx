import type { CSSProperties } from 'react'

export interface SparkleProps {
  size?: number
  /** Any CSS color; defaults to cream. Don't use gold outside crown/winner moments. */
  color?: string
  className?: string
  style?: CSSProperties
}

/** Decorative four-point star. */
export function Sparkle({ size = 24, color = 'var(--color-cream)', className, style }: SparkleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable={false}
      className={className}
      style={style}
    >
      <path
        fill={color}
        d="M12 0c.6 6.4 2.6 9.4 12 12-9.4 2.6-11.4 5.6-12 12-.6-6.4-2.6-9.4-12-12 9.4-2.6 11.4-5.6 12-12Z"
      />
    </svg>
  )
}
