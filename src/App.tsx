// Placeholder home screen until the real screens arrive in Phase 3.
// In dev, /#gallery shows the component gallery (excluded from production builds).
import { lazy, Suspense, useSyncExternalStore } from 'react'
import { ToastProvider } from './components/ToastProvider'
import { BackgroundSparkles } from './components/BackgroundSparkles'
import { Panel } from './components/Panel'
import { Button } from './components/Button'
import { Sparkle } from './components/Sparkle'

const Gallery = import.meta.env.DEV ? lazy(() => import('./screens/Gallery')) : null
// Temporary Phase 2 data-layer debug screen, dev-only like the gallery.
const DebugFirebase = import.meta.env.DEV ? lazy(() => import('./screens/DebugFirebase')) : null

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
const getHash = () => window.location.hash

function Placeholder() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <h1 className="relative font-display text-4xl leading-tight font-black tracking-wide uppercase sm:text-5xl">
        Whomst the most?
        <Sparkle size={22} color="var(--color-orange)" className="absolute -top-3 -right-2" />
      </h1>
      <p className="text-base text-cream/60">
        Who's most likely to... find out with friends. The game is coming soon.
      </p>
      <Panel variant="double" className="w-full">
        <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">
          Room code
        </p>
        <p className="mt-2 pl-[0.3em] font-mono text-5xl font-bold tracking-[0.3em]">WHMS</p>
      </Panel>
      <div className="flex w-full flex-col gap-3">
        <Button fullWidth disabled>
          Create Room
        </Button>
        <Button variant="secondary" fullWidth disabled>
          Join Room
        </Button>
      </div>
    </main>
  )
}

export default function App() {
  const hash = useSyncExternalStore(subscribeHash, getHash)
  const showGallery = Gallery !== null && hash === '#gallery'
  const showDebug = DebugFirebase !== null && hash === '#debug'

  return (
    <ToastProvider>
      <BackgroundSparkles />
      {showGallery && Gallery ? (
        <Suspense fallback={null}>
          <Gallery />
        </Suspense>
      ) : showDebug && DebugFirebase ? (
        <Suspense fallback={null}>
          <DebugFirebase />
        </Suspense>
      ) : (
        <Placeholder />
      )}
    </ToastProvider>
  )
}
