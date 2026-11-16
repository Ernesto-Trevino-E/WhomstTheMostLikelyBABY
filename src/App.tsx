// Hash-routed screens. In dev, /#gallery (components) and /#debug (Firebase) are also
// available; both are excluded from production builds.
import { lazy, Suspense } from 'react'
import { ToastProvider } from './components/ToastProvider'
import { BackgroundSparkles } from './components/BackgroundSparkles'
import { ScreenTransition } from './components/ScreenTransition'
import { useHashRoute } from './hooks/useHashRoute'
import Landing from './screens/Landing'
import CreateRoom from './screens/CreateRoom'
import JoinRoom from './screens/JoinRoom'
import Room from './screens/Room'

const Gallery = import.meta.env.DEV ? lazy(() => import('./screens/Gallery')) : null
// Temporary Phase 2 data-layer debug screen, dev-only like the gallery.
const DebugFirebase = import.meta.env.DEV ? lazy(() => import('./screens/DebugFirebase')) : null

function Routes() {
  const route = useHashRoute()
  switch (route.name) {
    case 'gallery':
      if (Gallery) return <Suspense fallback={null}><Gallery /></Suspense>
      return <Landing />
    case 'debug':
      if (DebugFirebase) return <Suspense fallback={null}><DebugFirebase /></Suspense>
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

export default function App() {
  const route = useHashRoute()
  const key = route.name === 'room' ? `room-${route.code}` : route.name
  return (
    <ToastProvider>
      <BackgroundSparkles />
      <ScreenTransition screenKey={key}>
        <Routes />
      </ScreenTransition>
    </ToastProvider>
  )
}
