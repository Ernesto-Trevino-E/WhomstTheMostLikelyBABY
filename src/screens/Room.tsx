// Room container: owns the live listeners, presence, host succession and kick handling,
// then shows the screen for the room's phase. Visiting #/ABCD as a non-member shows Join.
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { Screen, WaitingRow } from '../components/Screen'
import { useAuth } from '../hooks/useAuth'
import { navigate } from '../hooks/useHashRoute'
import { usePresence } from '../hooks/usePresence'
import { useKicked, usePlayers, usePrompts, useRoomMeta, useRoomSettings } from '../hooks/useRoom'
import { useServerNow } from '../hooks/useServerNow'
import { useToast } from '../hooks/useToast'
import { claimHostIfNeeded, effectiveHost } from '../lib/presence'
import { leaveRoom, setPhase } from '../lib/rooms'
import JoinRoom from './JoinRoom'
import Lobby from './Lobby'

export default function Room({ code }: { code: string }) {
  const toast = useToast()
  const { uid, error: authError } = useAuth()
  const serverNow = useServerNow()
  // Listen only once signed in: an unauthenticated listener is denied and never retries.
  const live = uid ? code : null
  const meta = useRoomMeta(live)
  const settings = useRoomSettings(live)
  const players = usePlayers(live)
  const prompts = usePrompts(live)
  const kicked = useKicked(live)
  const [leaving, setLeaving] = useState(false)

  const me = uid ? players.data?.[uid] : undefined
  const isKicked = Boolean(uid && kicked.data?.[uid])
  usePresence(code, uid, Boolean(me) && !isKicked && !leaving)

  const hostUid = effectiveHost(players.data, serverNow, kicked.data)

  // Host succession: whoever becomes the effective host writes it to meta.
  useEffect(() => {
    if (!uid || !me || !meta.data || isKicked) return
    claimHostIfNeeded(code, uid, meta.data.hostUid, players.data, serverNow, kicked.data).catch(
      (err: unknown) => console.warn('[host]', err),
    )
  }, [code, uid, me, meta.data, players.data, serverNow, kicked.data, isKicked])

  // "<name> is now the host" when the stored host changes.
  const prevHost = useRef<string | null>(null)
  const storedHost = meta.data?.hostUid ?? null
  useEffect(() => {
    const prev = prevHost.current
    prevHost.current = storedHost
    if (!prev || !storedHost || prev === storedHost || !me) return
    const name = players.data?.[storedHost]?.name
    toast.show(storedHost === uid ? 'You are now the host' : `${name ?? 'Someone'} is now the host`, 'info')
  }, [storedHost, me, players.data, uid, toast])

  // Kicked: remove my own records (rules only let me delete mine), then go home.
  const handledKick = useRef(false)
  useEffect(() => {
    if (!isKicked || !uid || handledKick.current) return
    handledKick.current = true
    const done = () => {
      toast.show('You were removed from this room.', 'error')
      navigate('', true)
    }
    if (me) leaveRoom(code, uid, me.name).then(done, done)
    else done()
  }, [isKicked, uid, me, code, toast])

  async function leave() {
    if (!uid || !me) return
    setLeaving(true)
    try {
      await leaveRoom(code, uid, me.name)
      navigate('', true)
    } catch {
      toast.show('Could not leave. Check your connection.', 'error')
      setLeaving(false)
    }
  }

  if (authError) {
    return <Notice title="Can't connect" text={`Sign-in failed: ${authError.message}`} />
  }
  const loading = !uid || meta.loading || players.loading || kicked.loading
  if (loading || isKicked || leaving) {
    return (
      <Screen className="justify-center">
        <WaitingRow label="Loading room" />
      </Screen>
    )
  }
  if (meta.error) {
    return <Notice title="Can't load room" text={meta.error.message} />
  }
  if (!meta.data) {
    return <Notice title="Room not found" text={`There is no open room with the code ${code}.`} />
  }
  if (!me) return <JoinRoom key={code} initialCode={code} />

  if (meta.data.phase === 'LOBBY') {
    return (
      <Lobby
        code={code}
        uid={uid}
        settings={settings.data}
        players={players.data}
        prompts={prompts.data}
        kicked={kicked.data}
        hostUid={hostUid}
        serverNow={serverNow}
        onLeave={leave}
      />
    )
  }

  // Temporary until Phase 4 builds the game loop.
  const isHost = hostUid === uid
  return (
    <Screen className="justify-center">
      <Panel variant="double" className="flex flex-col gap-4 text-center">
        <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">
          Room {code}
        </p>
        <h1 className="font-display text-2xl font-black tracking-wide uppercase">Game started</h1>
        <p className="text-base text-cream/60">The game loop arrives in Phase 4.</p>
        {isHost ? (
          <Button
            variant="secondary"
            fullWidth
            onClick={() =>
              setPhase(code, 'LOBBY').catch(() => toast.show('Could not go back.', 'error'))
            }
          >
            Back to lobby
          </Button>
        ) : (
          <WaitingRow />
        )}
      </Panel>
    </Screen>
  )
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <Screen className="justify-center">
      <Panel tone="red" className="flex flex-col gap-4 text-center">
        <h1 className="font-display text-xl font-black tracking-wide text-red uppercase">{title}</h1>
        <p className="text-base">{text}</p>
        <Button fullWidth onClick={() => navigate('', true)}>
          Home
        </Button>
      </Panel>
    </Screen>
  )
}
