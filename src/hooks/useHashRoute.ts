// Tiny hash router. Routes: '' landing, #/create, #/join, #/ABCD (a room; a link can be shared).
// #gallery is a dev-only screen handled in App.
import { useSyncExternalStore } from 'react'
import { isValidCode, normalizeCode } from '../lib/roomCode'

export type Route =
  | { name: 'landing' }
  | { name: 'create' }
  | { name: 'join'; code?: string }
  | { name: 'room'; code: string }
  | { name: 'gallery' }

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
const getHash = () => window.location.hash

export function parseHash(hash: string): Route {
  if (hash === '#gallery') return { name: 'gallery' }
  const path = hash.replace(/^#\/?/, '')
  if (path === 'create') return { name: 'create' }
  if (path === 'join') return { name: 'join' }
  const code = normalizeCode(path)
  if (isValidCode(code)) return { name: 'room', code }
  return { name: 'landing' }
}

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash)
  return parseHash(hash)
}

/** Change the route. `replace` avoids a history entry (e.g. after leaving a room). */
export function navigate(path: '' | 'create' | 'join' | string, replace = false): void {
  const hash = path ? `#/${path}` : ''
  if (replace) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash ? hash : '#/'
  }
}

/** Shareable link to a room. */
export const roomUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/${code}`
