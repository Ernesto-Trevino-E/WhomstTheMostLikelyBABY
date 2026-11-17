// Drives the Reveal sequence (styling brief 4.5): bars fill one after another, lowest
// first, under a drumroll; a 400ms pause; then the crown moment (gold flash, crown drop,
// glow, confetti, fanfare, long vibration). Runs once per room+round per tab: a reload on
// Reveal, or reduced motion, shows the final state at once.
import { useEffect, useRef, useState } from 'react'
import { vibrate } from '../lib/haptics'
import { playDrumroll, playFanfare } from '../lib/sound'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export type RevealStage = 'wait' | 'fill' | 'crown' | 'done'

const MAX_FILL_MS = 600
const TOTAL_FILL_MS = 4000
const PAUSE_MS = 400
const CROWN_MS = 900

function seenKey(code: string, round: number) {
  return `whomst:reveal:${code}:r${round}`
}

function hasSeen(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function markSeen(key: string) {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    // Storage blocked: a reload replays the sequence, which is harmless.
  }
}

export interface RevealSequenceInput {
  code: string
  round: number
  /** Rows with at least one vote (they fill one by one). */
  votedRows: number
  /** True when at least one player is crowned. */
  hasCrown: boolean
  /** Counts are final (frozen tally, or the fallback timeout passed). */
  ready: boolean
}

export interface RevealSequence {
  stage: RevealStage
  /** How many voted rows (counted from the lowest) have started filling. */
  started: number
  /** Fill duration per row. */
  perRowMs: number
  /** Final state without animation (reload or reduced motion). */
  instant: boolean
}

export function useRevealSequence({
  code,
  round,
  votedRows,
  hasCrown,
  ready,
}: RevealSequenceInput): RevealSequence {
  const reduced = usePrefersReducedMotion()
  const key = seenKey(code, round)
  const [seenBefore] = useState(() => hasSeen(key))
  const instant = seenBefore || reduced
  const [stage, setStage] = useState<RevealStage>('wait')
  const [started, setStarted] = useState(0)
  const [plan, setPlan] = useState<{ n: number; crown: boolean } | null>(null)
  const firedInstant = useRef(false)

  // Snapshot the shape once the counts are final, so a late tally can't restart the show.
  // (Set during render: React re-renders right away, before committing.)
  if (ready && !plan) setPlan({ n: votedRows, crown: hasCrown })

  const n = plan?.n ?? 0
  const perRowMs = n > 0 ? Math.min(MAX_FILL_MS, Math.floor(TOTAL_FILL_MS / n)) : 0

  useEffect(() => {
    if (!plan) return
    markSeen(key)
    if (instant) {
      // Reduced motion (first time only): no animation, but the fanfare and buzz still happen.
      if (!seenBefore && plan.crown && !firedInstant.current) {
        firedInstant.current = true
        playFanfare()
        vibrate('long')
      }
      return
    }

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const fillEnd = plan.n * perRowMs
    const stopRoll = playDrumroll(fillEnd)

    at(0, () => setStage('fill'))
    for (let k = 0; k < plan.n; k++) at(k * perRowMs, () => setStarted(k + 1))
    if (plan.crown) {
      at(fillEnd, stopRoll)
      at(fillEnd + PAUSE_MS, () => {
        setStage('crown')
        playFanfare()
        vibrate('long')
      })
      at(fillEnd + PAUSE_MS + CROWN_MS, () => setStage('done'))
    } else {
      at(fillEnd, () => {
        stopRoll()
        setStage('done')
      })
    }
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      stopRoll()
    }
  }, [plan, key, instant, seenBefore, perRowMs])

  if (instant) return { stage: plan ? 'done' : 'wait', started: Infinity, perRowMs: 0, instant }
  return { stage, started, perRowMs, instant }
}
