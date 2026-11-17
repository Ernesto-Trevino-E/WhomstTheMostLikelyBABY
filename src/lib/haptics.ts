// Phone vibration via navigator.vibrate. Silently skipped where unsupported (iOS Safari).
// Not tied to the mute toggle (mute is sound only).

const PATTERNS = {
  short: 30,
  long: [120, 60, 260],
} as const

export function vibrate(kind: keyof typeof PATTERNS) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(PATTERNS[kind] as number | number[])
    }
  } catch {
    // Some browsers throw when vibration is blocked; ignore.
  }
}
