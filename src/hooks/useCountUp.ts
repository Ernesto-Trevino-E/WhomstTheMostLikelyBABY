import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Counts from `from` to `to` over `ms` once `active` is true (ease-out).
 * Before that it shows `from`; with reduced motion it shows `to` right away.
 */
export function useCountUp(to: number, ms: number, active = true, from = 0): number {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(from)
  const instant = reduced || ms <= 0 || to === from

  useEffect(() => {
    if (!active || instant) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(from + (to - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, instant, from, to, ms])

  if (reduced) return to
  if (instant) return active ? to : from
  return value
}
