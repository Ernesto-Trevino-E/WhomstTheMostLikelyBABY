// Dev-only Firebase debug screen (open /#debug in `npm run dev`). Temporary: proves the
// data layer with several tabs before the real screens arrive in Phase 3.
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { PlayerChip, Badge } from '../components/PlayerChip'
import { Divider } from '../components/Divider'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { usePresence } from '../hooks/usePresence'
import { usePlayers, useRoomMeta, useVotes } from '../hooks/useRoom'
import { useServerNow } from '../hooks/useServerNow'
import { NAME_MAX } from '../lib/model'
import {
  activePlayers,
  claimHostIfNeeded,
  effectiveHost,
  isLeft,
  isReconnecting,
} from '../lib/presence'
import { RoomError, createRoom, joinRoom, leaveRoom } from '../lib/rooms'
import { castVote } from '../lib/votes'

const STORE_KEY = 'whomst.debug.room'

function loadStored(): string | null {
  try {
    return sessionStorage.getItem(STORE_KEY)
  } catch {
    return null
  }
}
function store(code: string | null) {
  try {
    if (code) sessionStorage.setItem(STORE_KEY, code)
    else sessionStorage.removeItem(STORE_KEY)
  } catch {
    /* storage unavailable: reload just loses the room */
  }
}

const inputClass =
  'min-h-12 w-full rounded-lg border-2 border-slate bg-space px-4 text-base text-cream placeholder:text-cream/40 focus:border-orange focus:outline-none'

export default function DebugFirebase() {
  const toast = useToast()
  const { uid, error: authError } = useAuth()
  const serverNow = useServerNow()
  const [code, setCode] = useState<string | null>(loadStored)
  const [nameInput, setNameInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [testRound, setTestRound] = useState(0)

  const meta = useRoomMeta(code)
  const players = usePlayers(code)
  const votes = useVotes(code, code ? testRound : null)

  const me = uid ? players.data?.[uid] : undefined
  usePresence(code, uid, Boolean(me))

  const hostUid = effectiveHost(players.data, serverNow)
  const list = Object.entries(players.data ?? {}).sort(([, a], [, b]) => a.joinNumber - b.joinNumber)
  const activeCount = activePlayers(players.data, serverNow).length
  const iVoted = uid ? votes.votedUids.includes(uid) : false

  // Host succession: whoever becomes the effective host writes it to meta.
  useEffect(() => {
    if (!code || !uid || !meta.data) return
    claimHostIfNeeded(code, uid, meta.data.hostUid, players.data, serverNow)
      .then((claimed) => claimed && toast.show('You are now the host', 'info'))
      .catch((err: unknown) => console.warn('[host]', err))
  }, [code, uid, meta.data, players.data, serverNow, toast])

  async function run(action: () => Promise<{ code: string; rejoined: boolean; joinNumber: number }>) {
    setBusy(true)
    try {
      const res = await action()
      setCode(res.code)
      store(res.code)
      toast.show(
        res.rejoined ? `Rejoined as #${res.joinNumber}` : `In room ${res.code} as #${res.joinNumber}`,
        'info',
      )
    } catch (err) {
      const message = err instanceof RoomError ? `${err.code}: ${err.message}` : String(err)
      toast.show(message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function leave() {
    if (!code || !uid) return
    setBusy(true)
    try {
      if (me) await leaveRoom(code, uid, me.name)
      setCode(null)
      store(null)
    } catch (err) {
      toast.show(String(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function vote(target: string) {
    if (!code || !uid) return
    try {
      await castVote(code, testRound, uid, target)
    } catch (err) {
      toast.show(`Vote rejected: ${String(err)}`, 'error')
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-black tracking-wide uppercase">Firebase debug</h1>
        <p className="font-mono text-xs break-all text-cream/60">
          uid: {uid ?? (authError ? `auth error: ${authError.message}` : 'signing in...')}
        </p>
      </header>

      {!code ? (
        <Panel className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder={`Display name (max ${NAME_MAX})`}
            value={nameInput}
            maxLength={NAME_MAX + 4}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <Button fullWidth disabled={busy || !uid} onClick={() => run(() => createRoom(nameInput))}>
            Create room
          </Button>
          <Divider label="or" />
          <input
            className={`${inputClass} font-mono tracking-[0.3em] uppercase`}
            placeholder="CODE"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />
          <Button
            variant="secondary"
            fullWidth
            disabled={busy || !uid}
            onClick={() => run(() => joinRoom(codeInput, nameInput))}
          >
            Join room
          </Button>
        </Panel>
      ) : (
        <>
          <Panel variant="double" className="flex flex-col gap-2">
            <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">Room</p>
            <p className="pl-[0.3em] font-mono text-4xl font-bold tracking-[0.3em]">{code}</p>
            <p className="font-mono text-xs text-cream/60">
              phase {meta.data?.phase ?? '?'} · round {meta.data?.roundNumber ?? '?'} · next # {meta.data?.nextJoinNumber ?? '?'}
            </p>
            <p className="font-mono text-xs break-all text-cream/60">
              stored host {meta.data?.hostUid.slice(0, 8) ?? '?'} · effective host {hostUid?.slice(0, 8) ?? 'none'}
            </p>
            {meta.error && <p className="text-sm text-red">{meta.error.message}</p>}
            {!meta.loading && !meta.data && <p className="text-sm text-red">Room not found.</p>}
            {uid && players.data && !me && (
              <p className="text-sm text-red">You are not a player in this room (left or removed).</p>
            )}
          </Panel>

          <section className="flex flex-col gap-2">
            <Divider label={`Players · ${activeCount} active`} />
            {list.map(([pid, p]) => {
              const left = isLeft(p, serverNow)
              const away = isReconnecting(p, serverNow)
              return (
                <PlayerChip
                  key={pid}
                  name={p.name}
                  joinNumber={p.joinNumber}
                  showNumber
                  isHost={pid === hostUid}
                  isYou={pid === uid}
                  disconnected={away}
                  dimmed={left}
                  trailing={
                    <span className="flex items-center gap-2">
                      {left && <Badge className="border border-cream/40 text-cream/60">Left</Badge>}
                      {away && (
                        <span className="font-mono text-xs text-cream/60">
                          {Math.max(0, Math.ceil((30_000 - (serverNow - p.lastSeen)) / 1000))}s
                        </span>
                      )}
                      <span className="font-mono text-sm font-bold text-orange">
                        {votes.counts[pid] ?? 0}
                      </span>
                    </span>
                  }
                />
              )
            })}
          </section>

          <section className="flex flex-col gap-3">
            <Divider label={`Test votes · round ${testRound}`} />
            <p className="text-sm text-cream/60">
              {votes.votedUids.length} / {activeCount} voted · {votes.total} ballots
              {iVoted && ' · you voted'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {list
                .filter(([, p]) => !isLeft(p, serverNow))
                .map(([pid, p]) => (
                  <Button key={pid} variant="secondary" size="sm" disabled={!me || iVoted} onClick={() => vote(pid)}>
                    {p.name}
                  </Button>
                ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTestRound((r) => r + 1)}>
                Next test round
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!me}
                onClick={() =>
                  castVote(code, testRound, uid ?? '', list[0]?.[0] ?? '')
                    .then(() => toast.show('Second vote was accepted (rules bug!)', 'error'))
                    .catch(() => toast.show('Second vote rejected by rules (good)', 'info'))
                }
              >
                Try double vote
              </Button>
            </div>
          </section>

          <Button variant="danger" fullWidth disabled={busy} onClick={leave}>
            Leave room
          </Button>
        </>
      )}
    </main>
  )
}
