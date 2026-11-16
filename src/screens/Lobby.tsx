// Lobby: room code, live player list, host controls (Start, Kick, Prompts), prompt submissions.
import { useState } from 'react'
import { Button } from '../components/Button'
import { Divider } from '../components/Divider'
import { KickIcon } from '../components/icons'
import { Modal } from '../components/Modal'
import { Panel } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { PromptSubmitForm } from '../components/PromptSubmitForm'
import { PromptsModal } from '../components/PromptsModal'
import { RoomCodeDisplay } from '../components/RoomCodeDisplay'
import { Screen, WaitingRow } from '../components/Screen'
import { roomUrl } from '../hooks/useHashRoute'
import { useToast } from '../hooks/useToast'
import {
  DEFAULT_SETTINGS,
  MIN_PLAYERS,
  type Player,
  type RoomSettings,
  type SubmittedPrompt,
} from '../lib/model'
import { activePlayers, isReconnecting } from '../lib/presence'
import { waitingTotal } from '../lib/prompts'
import { kickPlayer, startGame } from '../lib/rooms'

export interface LobbyProps {
  code: string
  uid: string
  settings: RoomSettings | null
  players: Record<string, Player> | null
  prompts: Record<string, SubmittedPrompt> | null
  kicked: Record<string, true> | null
  hostUid: string | null
  serverNow: number
  onLeave: () => void
}

export default function Lobby({
  code,
  uid,
  settings,
  players,
  prompts,
  kicked,
  hostUid,
  serverNow,
  onLeave,
}: LobbyProps) {
  const toast = useToast()
  const [modal, setModal] = useState<null | 'prompts' | 'add' | 'leave'>(null)
  const [kickTarget, setKickTarget] = useState<{ uid: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const list = activePlayers(players, serverNow, kicked)
  const isHost = hostUid === uid
  const canStart = list.length >= MIN_PLAYERS
  const allowSubmissions = (settings ?? DEFAULT_SETTINGS).allowSubmissions
  const waiting = waitingTotal(prompts)

  async function start() {
    setBusy(true)
    try {
      await startGame(code)
    } catch {
      toast.show('Could not start. Check your connection.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function confirmKick() {
    if (!kickTarget) return
    setBusy(true)
    try {
      await kickPlayer(code, kickTarget.uid)
      toast.show(`${kickTarget.name} was removed`, 'info')
    } catch {
      toast.show('Could not remove that player.', 'error')
    } finally {
      setBusy(false)
      setKickTarget(null)
    }
  }

  return (
    <Screen className="gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-black tracking-wide uppercase">Lobby</h1>
        <Button variant="ghost" size="sm" onClick={() => setModal('leave')}>
          Leave
        </Button>
      </header>

      <RoomCodeDisplay code={code} shareUrl={roomUrl(code)} />

      <Panel className="flex min-h-0 flex-col gap-3">
        <Divider label={`Players (${list.length})`} />
        <ul className="flex max-h-[45dvh] flex-col gap-1 overflow-y-auto">
          {list.map(([pid, p]) => (
            <li key={pid}>
              <PlayerChip
                name={p.name}
                joinNumber={p.joinNumber}
                showNumber
                isHost={pid === hostUid}
                isYou={pid === uid}
                disconnected={isReconnecting(p, serverNow)}
                trailing={
                  isHost && pid !== uid ? (
                    <button
                      type="button"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => setKickTarget({ uid: pid, name: p.name })}
                      className="inline-flex size-12 cursor-pointer items-center justify-center rounded-pill text-red hover:bg-red/10 focus-visible:shadow-glow-red focus-visible:outline-none"
                    >
                      <KickIcon size={20} />
                    </button>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
        <p className="text-sm text-cream/60">
          {waiting === 1 ? '1 player prompt waiting' : `${waiting} player prompts waiting`}
          {allowSubmissions ? '' : ' · player prompts are off'}
        </p>
      </Panel>

      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-3 bg-space/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {isHost ? (
          <>
            <Button fullWidth disabled={!canStart || busy} onClick={start}>
              Start Game
            </Button>
            {!canStart && (
              <p className="text-center text-sm text-cream/60">
                Need {MIN_PLAYERS} players ({list.length} / {MIN_PLAYERS})
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setModal('prompts')}>
                Prompts
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setModal('add')}>
                Add a prompt
              </Button>
            </div>
          </>
        ) : (
          <>
            <WaitingRow />
            <Button variant="secondary" size="sm" fullWidth onClick={() => setModal('add')}>
              Add a prompt
            </Button>
          </>
        )}
      </div>

      {isHost && (
        <PromptsModal
          open={modal === 'prompts'}
          onClose={() => setModal(null)}
          code={code}
          settings={settings}
          waiting={waiting}
        />
      )}

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add a prompt">
        {modal === 'add' && (
          <PromptSubmitForm
            code={code}
            uid={uid}
            allowed={allowSubmissions}
            prompts={prompts}
            onSubmitted={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal
        open={kickTarget !== null}
        onClose={() => setKickTarget(null)}
        title="Remove player?"
        tone="red"
        actions={
          <>
            <Button variant="danger" fullWidth disabled={busy} onClick={confirmKick}>
              Remove
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setKickTarget(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <p>
          Remove <strong>{kickTarget?.name}</strong> from the room? They can't rejoin from the same
          tab.
        </p>
      </Modal>

      <Modal
        open={modal === 'leave'}
        onClose={() => setModal(null)}
        title="Leave room?"
        actions={
          <>
            <Button variant="danger" fullWidth onClick={onLeave}>
              Leave
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setModal(null)}>
              Stay
            </Button>
          </>
        }
      >
        <p>{isHost ? 'The host role passes to the next player.' : 'You can rejoin with the code.'}</p>
      </Modal>
    </Screen>
  )
}
