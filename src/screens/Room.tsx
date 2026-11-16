// Room container: owns the live listeners, presence, host succession and kick handling,
// then shows the screen for the room's phase. Visiting #/ABCD as a non-member shows Join.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Panel } from '../components/Panel'
import type { GameProps } from '../components/GameScreen'
import { ScreenTransition } from '../components/ScreenTransition'
import { Screen, WaitingRow } from '../components/Screen'
import { useAuth } from '../hooks/useAuth'
import { useConnectionLost } from '../hooks/useConnected'
import { navigate } from '../hooks/useHashRoute'
import { usePresence } from '../hooks/usePresence'
import {
  useKicked,
  usePlayers,
  usePrompts,
  useRoomMeta,
  useRoomSettings,
  useRound,
  useScores,
  useVotes,
} from '../hooks/useRoom'
import { useServerNow } from '../hooks/useServerNow'
import { useToast } from '../hooks/useToast'
import {
  activePlayers,
  claimHostIfNeeded,
  effectiveHost,
  leftPlayers,
  pruneLeftPlayers,
} from '../lib/presence'
import { eligiblePlayers, endVoting, isInGame, returnToLobby } from '../lib/game'
import { MIN_PLAYERS, type Phase } from '../lib/model'
import { leaveRoom } from '../lib/rooms'
import FinalResults from './FinalResults'
import JoinRoom from './JoinRoom'
import Lobby from './Lobby'
import PromptScreen from './PromptScreen'
import RevealScreen from './RevealScreen'
import ScoreboardScreen from './ScoreboardScreen'
import VoteScreen from './VoteScreen'

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
  const round = useRound(live)
  const scores = useScores(live)
  const phase = meta.data?.phase
  const roundNumber = meta.data?.roundNumber ?? 0
  const votesOn = phase === 'VOTE' || phase === 'REVEAL'
  const votes = useVotes(live, votesOn ? roundNumber : null)
  const voted = useMemo(
    () => Object.fromEntries(votes.votedUids.map((v) => [v, true as const])),
    [votes.votedUids],
  )
  const [leaving, setLeaving] = useState(false)

  const me = uid ? players.data?.[uid] : undefined
  const isKicked = Boolean(uid && kicked.data?.[uid])
  const connectionLost = useConnectionLost()

  // Back after the grace period: I already count as left, so remove my stale record and
  // show the Join form (I rejoin as a new player, and don't get the host role back).
  usePresence(code, uid, Boolean(me) && !isKicked && !leaving, (p) => {
    if (!uid) return
    leaveRoom(code, uid, p.name)
      .catch((err: unknown) => console.warn('[expired]', err))
      .finally(() => toast.show('You were away too long. Join again as a new player.', 'error'))
  })

  const hostUid = effectiveHost(players.data, serverNow, kicked.data)
  const isHost = Boolean(uid && hostUid === uid)
  const activeCount = activePlayers(players.data, serverNow, kicked.data).length

  // The host removes the records of players who left (frees their names).
  const leftKey = leftPlayers(players.data, serverNow)
    .map(([pid]) => pid)
    .join(',')
  const prunedKey = useRef('')
  useEffect(() => {
    if (!isHost || !leftKey || prunedKey.current === leftKey) return
    prunedKey.current = leftKey
    pruneLeftPlayers(code, players.data, serverNow).catch((err: unknown) => {
      prunedKey.current = ''
      console.warn('[prune]', err)
    })
  }, [isHost, leftKey, code, players.data, serverNow])

  // Fewer than 4 players mid-game: the host sends everyone back to the lobby.
  const returnedRound = useRef(-1)
  useEffect(() => {
    if (!isHost || !isInGame(phase) || activeCount >= MIN_PLAYERS) return
    if (returnedRound.current === roundNumber) return
    returnedRound.current = roundNumber
    returnToLobby(code, roundNumber).catch((err: unknown) => {
      returnedRound.current = -1
      console.warn('[below-min]', err)
    })
  }, [isHost, phase, activeCount, roundNumber, code])

  // Every tab: in-game -> lobby (not via Play Again) shows the "Not enough players" notice.
  const [notEnough, setNotEnough] = useState(false)
  const prevPhase = useRef<Phase | undefined>(undefined)
  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = phase
    if (phase === 'LOBBY' && isInGame(prev)) setNotEnough(true)
  }, [phase])

  // Host succession: whoever becomes the effective host writes it to meta.
  useEffect(() => {
    if (!uid || !me || !meta.data || isKicked) return
    claimHostIfNeeded(code, uid, meta.data.hostUid, players.data, serverNow, kicked.data).catch(
      (err: unknown) => console.warn('[host]', err),
    )
  }, [code, uid, me, meta.data, players.data, serverNow, kicked.data, isKicked])

  // Auto-advance to Reveal once every eligible player who is online has voted. Only the
  // effective host does it (the next host takes over if they drop); endVoting is guarded.
  const endedRound = useRef(0)
  const currentRound = round.data?.number === roundNumber ? round.data : null
  useEffect(() => {
    if (!isHost || phase !== 'VOTE' || !currentRound || endedRound.current === roundNumber) return
    const waitFor = eligiblePlayers(currentRound, players.data, serverNow, kicked.data).filter(
      ([, p]) => p.online,
    )
    if (waitFor.length === 0 || !waitFor.every(([pid]) => voted[pid])) return
    endedRound.current = roundNumber
    endVoting(code, roundNumber).catch((err: unknown) => {
      endedRound.current = 0
      console.warn('[auto-reveal]', err)
    })
  }, [isHost, phase, currentRound, roundNumber, players.data, serverNow, kicked.data, voted, code])

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

  const frame = (content: ReactNode) => (
    <>
      {connectionLost && (
        <div className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[480px] px-4 pt-2">
          <Banner type="alert">Reconnecting... you keep your spot for 30 seconds.</Banner>
        </div>
      )}
      {content}
      <Modal
        open={notEnough}
        onClose={() => setNotEnough(false)}
        title="Back to the lobby"
        tone="sage"
        hideClose
        actions={
          <Button fullWidth onClick={() => setNotEnough(false)}>
            OK
          </Button>
        }
      >
        <p>Not enough players. Back to the lobby to wait for more.</p>
      </Modal>
    </>
  )

  if (meta.data.phase === 'LOBBY') {
    return frame(
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
      />,
    )
  }

  // In game: wait until the round written by the draw matches meta (they are two writes).
  if (!currentRound) {
    return frame(
      <Screen className="justify-center">
        <WaitingRow label="Loading round" />
      </Screen>,
    )
  }

  const gameBaseRound = Math.min(meta.data.gameBaseRound ?? 0, roundNumber - 1)
  const game: GameProps = {
    code,
    uid,
    isHost,
    hostUid,
    round: currentRound,
    displayRound: roundNumber - gameBaseRound,
    gameBaseRound,
    players: players.data,
    kicked: kicked.data,
    scores: scores.data,
    settings: settings.data,
    prompts: prompts.data,
    serverNow,
    onLeave: leave,
  }
  return frame(
    <ScreenTransition screenKey={`${meta.data.phase}-${roundNumber}`}>
      {meta.data.phase === 'PROMPT' && <PromptScreen {...game} />}
      {meta.data.phase === 'VOTE' && <VoteScreen {...game} voted={voted} />}
      {meta.data.phase === 'REVEAL' && <RevealScreen {...game} liveCounts={votes.counts} />}
      {meta.data.phase === 'SCOREBOARD' && <ScoreboardScreen {...game} />}
      {meta.data.phase === 'FINAL_RESULTS' && <FinalResults {...game} />}
    </ScreenTransition>,
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
