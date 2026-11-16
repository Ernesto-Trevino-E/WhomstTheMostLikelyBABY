// Firebase init (modular SDK). Anonymous auth with per-tab (session) persistence:
// reloading a tab keeps the same player; a new tab is a new player.
import { initializeApp } from 'firebase/app'
import {
  browserSessionPersistence,
  initializeAuth,
  signInAnonymously,
  type User,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(config)
export const auth = initializeAuth(app, { persistence: browserSessionPersistence })
export const db = getDatabase(app)

let signingIn: Promise<User> | null = null

/** Resolves with the signed-in anonymous user, signing in once if needed. */
export function ensureSignedIn(): Promise<User> {
  if (signingIn) return signingIn
  signingIn = auth
    .authStateReady()
    .then(() => auth.currentUser ?? signInAnonymously(auth).then((c) => c.user))
    .catch((err: unknown) => {
      signingIn = null
      throw err
    })
  return signingIn
}
