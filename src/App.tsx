// Phase 0 placeholder screen: proves the theme tokens and the three fonts load.
// Replaced by the real screens in Phase 1 (gallery) and Phase 3 (landing).

const swatches = [
  { name: 'panel', className: 'bg-panel' },
  { name: 'slate', className: 'bg-slate' },
  { name: 'cream', className: 'bg-cream' },
  { name: 'orange', className: 'bg-orange' },
  { name: 'red', className: 'bg-red' },
  { name: 'sage', className: 'bg-sage' },
]

export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <h1 className="font-display text-4xl leading-tight font-black tracking-wide uppercase sm:text-5xl">
        Whomst the most?
      </h1>

      <p className="text-base text-cream/60">
        Who's most likely to... find out with friends. The game is coming soon.
      </p>

      <div className="w-full rounded-panel border-2 border-slate bg-panel p-4 sm:p-6">
        <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">
          Room code
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tracking-[0.3em]">WHMS</p>
      </div>

      <ul className="flex flex-wrap justify-center gap-2" aria-label="Theme colors">
        {swatches.map((s) => (
          <li
            key={s.name}
            title={s.name}
            className={`size-8 rounded-pill border-2 border-cream/20 ${s.className}`}
          />
        ))}
      </ul>
    </main>
  )
}
