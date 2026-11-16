// TEMPORARY (Phase 4): plain final crown list after End Game. Phase 5 replaces it with the
// final results screen (podium, highlights, Play Again with a score reset, Leave).
import { Button } from '../components/Button'
import { CrownBadge } from '../components/CrownBadge'
import { Divider } from '../components/Divider'
import { GameScreen, type GameProps } from '../components/GameScreen'
import { useAction } from '../hooks/useAction'
import { Panel } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { WaitingRow } from '../components/Screen'
import { backToLobby } from '../lib/game'
import { activePlayers } from '../lib/presence'

export default function GameOver(props: GameProps) {
  const { code, uid, isHost, hostUid, round, players, kicked, scores, serverNow, onLeave } = props
  const { busy, run } = useAction()
  const rows = activePlayers(players, serverNow, kicked)
    .map(([pid, p]) => ({ pid, p, crowns: scores?.[pid] ?? 0 }))
    .sort((a, b) => b.crowns - a.crowns || a.p.joinNumber - b.p.joinNumber)

  return (
    <GameScreen
      label="Game over"
      isHost={isHost}
      onLeave={onLeave}
      footer={
        isHost ? (
          <Button
            fullWidth
            disabled={busy}
            onClick={() => run(() => backToLobby(code, round.number), 'Could not go back.')}
          >
            Back to lobby
          </Button>
        ) : (
          <WaitingRow />
        )
      }
    >
      <h1 className="font-display text-2xl font-black tracking-wide uppercase">Final crowns</h1>
      <Panel className="flex flex-col gap-3">
        <Divider label={`After ${round.number} round${round.number === 1 ? '' : 's'}`} />
        <ul className="flex flex-col gap-1">
          {rows.map(({ pid, p, crowns }) => (
            <li key={pid}>
              <PlayerChip
                name={p.name}
                joinNumber={p.joinNumber}
                isHost={pid === hostUid}
                isYou={pid === uid}
                trailing={
                  crowns > 0 ? (
                    <CrownBadge size="sm" count={crowns} glow={false} />
                  ) : (
                    <span className="font-mono text-sm font-bold text-cream/60">0</span>
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Panel>
    </GameScreen>
  )
}
