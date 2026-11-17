import { useEffect, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const COLORS = ['var(--color-cream)', 'var(--color-orange)', 'var(--color-gold)', 'var(--color-sage)']
const PIECES = 40
const LIFETIME_MS = 2800

interface Piece {
  left: number
  delay: number
  fall: number
  drift: number
  spin: number
  w: number
  h: number
  color: string
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 250,
    fall: 1400 + Math.random() * 1000,
    drift: (Math.random() - 0.5) * 120,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    color: COLORS[i % COLORS.length],
  }))
}

/** One-shot confetti burst over the screen. Change `burstKey` to fire again. Off with reduced motion. */
export function Confetti({ burstKey = 0 }: { burstKey?: number }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return null
  return <Burst key={burstKey} />
}

function Burst() {
  const [pieces] = useState(makePieces)
  const [alive, setAlive] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setAlive(false), LIFETIME_MS)
    return () => window.clearTimeout(t)
  }, [])
  if (!alive) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti rounded-[2px]"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.h,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              '--fall': `${p.fall}ms`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
