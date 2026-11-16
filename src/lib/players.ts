// Player color and initials helpers (styling brief 4.1).

/** 10 player colors in join order. Same values as theme tokens p1..p10. Gold is never used. */
export const PLAYER_COLORS = [
  '#FF6B5A',
  '#5BC0EB',
  '#9BC53D',
  '#A78BFA',
  '#F472B6',
  '#2EC4B6',
  '#FF9F1C',
  '#7C8CFF',
  '#8FBFB0',
  '#D291BC',
] as const

/**
 * Color for a player by join number (1-based). Cycles after 10.
 * Non-positive or non-integer input falls back to the first color.
 */
export function playerColor(joinNumber: number): string {
  const n = Number.isFinite(joinNumber) ? Math.max(1, Math.floor(joinNumber)) : 1
  return PLAYER_COLORS[(n - 1) % PLAYER_COLORS.length]
}

/**
 * 1–2 uppercase initials from a display name.
 * "Ana Maria Lopez" -> "AL", "Bob" -> "BO", "Q" -> "Q", "Dee 🎉" -> "DE", "" -> "?".
 * Uses grapheme-safe splitting so emoji are not cut in half.
 */
export function initials(name: string): string {
  const all = name.trim().split(/\s+/).filter(Boolean)
  if (all.length === 0) return '?'
  // Prefer words with a letter or digit, so "Dee 🎉" gives "DE", not "D🎉".
  const hasLetter = (w: string) => /[\p{L}\p{N}]/u.test(w)
  const words = all.some(hasLetter) ? all.filter(hasLetter) : all

  const chars = (s: string) => Array.from(s)
  if (words.length === 1) {
    return chars(words[0]).slice(0, 2).join('').toUpperCase()
  }
  const first = chars(words[0])[0] ?? ''
  const last = chars(words[words.length - 1])[0] ?? ''
  return (first + last).toUpperCase()
}
