// Scoreboard: running crown tally. The host starts the next round, changes the prompt
// filter between rounds, or ends the game.
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { CrownBadge } from '../components/CrownBadge'
import { Divider } from '../components/Divider'
import { GameScreen, type GameProps } from '../components/GameScreen'
import { useAction } from '../hooks/useAction'
import { useCountUp } from '../hooks/useCountUp'
import { cn } from '../lib/cn'
import { Modal } from '../components/Modal'
import { Panel } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { PromptsModal } from '../components/PromptsModal'
import { WaitingRow } from '../components/Screen'
import { crownedUids, drawNextRound, endGame } from '../lib/game'
import { activePlayers, isReconnecting } from '../lib/presence'
import { waitingTotal } from '../lib/prompts'

export default function ScoreboardScreen(props: GameProps) {
  const { code, uid, isHost, hostUid, round, displayRound, players, kicked, scores, settings, prompts, serverNow, onLeave } =
    props
  const { busy, run } = useAction()
  const [modal, setModal] = useState<null | 'prompts' | 'end'>(null)

  const latest = new Set(crownedUids(round.tally))
  const rows = activePlayers(players, serverNow, kicked)
    .map(([pid, p]) => ({ pid, p, crowns: scores?.[pid] ?? 0 }))
    .sort((a, b) => b.crowns - a.crowns || a.p.joinNumber - b.p.joinNumber)

  return (
    <GameScreen
      label={`Round ${displayRound} · Scores`}
      isHost={isHost}
      onLeave={onLeave}
      footer={
        isHost ? (
          <>
            <Button
              fullWidth
              disabled={busy}
              onClick={() => run(() => drawNextRound(code), 'Could not start the next round.')}
            >
              Next Round
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setModal('prompts')}>
                Prompts
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={() => setModal('end')}>
                End Game
              </Button>
            </div>
          </>
        ) : (
          <WaitingRow />
        )
      }
    >
      <Panel className="flex min-h-0 flex-col gap-3">
        <Divider label="Crowns" />
        <ul className="flex flex-col gap-1">
          {rows.map(({ pid, p, crowns }) => (
            <li key={pid}>
              <PlayerChip
                name={p.name}
                joinNumber={p.joinNumber}
                isHost={pid === hostUid}
                isYou={pid === uid}
                disconnected={isReconnecting(p, serverNow)}
                trailing={
                  <span className="flex items-center gap-2">
                    {latest.has(pid) && (
                      <span className="font-mono text-sm font-bold text-sage" aria-label="Won this round">
                        +1
                      </span>
                    )}
                    {crowns > 0 ? (
                      latest.has(pid) ? (
                        <TickingCrowns crowns={crowns} />
                      ) : (
                        <CrownBadge size="sm" count={crowns} glow={false} />
                      )
                    ) : (
                      <span className="font-mono text-sm font-bold text-cream/60">0</span>
                    )}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </Panel>

      {isHost && (
        <PromptsModal
          open={modal === 'prompts'}
          onClose={() => setModal(null)}
          code={code}
          settings={settings}
          waiting={waitingTotal(prompts)}
        />
      )}

      <Modal
        open={modal === 'end'}
        onClose={() => setModal(null)}
        title="End the game?"
        tone="red"
        actions={
          <>
            <Button
              variant="danger"
              fullWidth
              disabled={busy}
              onClick={() => {
                setModal(null)
                void run(() => endGame(code, round.number), 'Could not end the game.')
              }}
            >
              End Game
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setModal(null)}>
              Keep playing
            </Button>
          </>
        }
      >
        <p>Everyone goes to the final results.</p>
      </Modal>
    </GameScreen>
  )
}

const TICK_DELAY_MS = 300

/** Latest winner's crown count: ticks up from the previous count with a brief pulse. */
function TickingCrowns({ crowns }: { crowns: number }) {
  const [go, setGo] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setGo(true), TICK_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])
  const shown = useCountUp(crowns, 250, go, crowns - 1)
  return (
    <CrownBadge
      size="sm"
      count={shown}
      glow
      className={cn(go && 'animate-tick-pop')}
    />
  )
}
