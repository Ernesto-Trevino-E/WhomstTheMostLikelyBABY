import { Sparkle } from './Sparkle'

/** A few static, low-contrast sparkles in the screen corners (styling brief 4.2). */
export function BackgroundSparkles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Sparkle size={28} className="absolute top-6 left-5 opacity-25" />
      <Sparkle size={14} className="absolute top-20 left-14 opacity-15" color="var(--color-sage)" />
      <Sparkle size={20} className="absolute top-10 right-6 opacity-20" color="var(--color-orange)" />
      <Sparkle size={24} className="absolute bottom-10 left-8 opacity-15" color="var(--color-sage)" />
      <Sparkle size={32} className="absolute right-6 bottom-16 opacity-20" />
      <Sparkle size={12} className="absolute right-16 bottom-8 opacity-15" color="var(--color-orange)" />
    </div>
  )
}
