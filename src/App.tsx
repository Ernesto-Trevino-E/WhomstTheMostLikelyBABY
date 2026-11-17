// Hash-routed screens. In dev, /#gallery (components) is also available; it is excluded
// from production builds.
import { lazy, Suspense, useEffect } from 'react'
import { ToastProvider } from './components/ToastProvider'
import { BackgroundSparkles } from './components/BackgroundSparkles'
import { MuteToggle } from './components/MuteToggle'
import { ScreenTransition } from './components/ScreenTransition'
import { useHashRoute } from './hooks/useHashRoute'
import { useMuted } from './hooks/useMuted'
import { unlockAudio } from './lib/sound'
import Landing from './screens/Landing'
import CreateRoom from './screens/CreateRoom'
import JoinRoom from './screens/JoinRoom'
import Room from './screens/Room'

const Gallery = import.meta.env.DEV ? lazy(() => import('./screens/Gallery')) : null

function Routes() {
  const route = useHashRoute()
  switch (route.name) {
    case 'gallery':
      if (Gallery) return <Suspense fallback={null}><Gallery /></Suspense>
      return <Landing />
    case 'create':
      return <CreateRoom />
    case 'join':
      return <JoinRoom />
    case 'room':
      return <Room key={route.code} code={route.code} />
    default:
      return <Landing />
  }
}

/** Mobile browsers only allow audio after a user gesture: (re)unlock on every press. */
function useAudioUnlock() {
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])
}

/** Always-visible sound toggle in the top-right corner of the column. */
function CornerMute() {
  const [muted, toggle] = useMuted()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto flex max-w-[480px] justify-end px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <MuteToggle muted={muted} onToggle={toggle} className="pointer-events-auto" />
    </div>
  )
}

export default function App() {
  const route = useHashRoute()
  const key = route.name === 'room' ? `room-${route.code}` : route.name
  useAudioUnlock()
  return (
    <ToastProvider>
      <BackgroundSparkles />
      <CornerMute />
      <ScreenTransition screenKey={key}>
        <Routes />
      </ScreenTransition>
    </ToastProvider>
  )
}
