// Reveal phase: votes per player (never who voted for whom), top player(s) crowned.
// Plain layout for now; Phase 6 adds the count-up, drumroll and crown-drop sequence.
import { Button } from '../components/Button'
import { CrownBadge } from '../components/CrownBadge'
import { GameScreen, PromptText, type GameProps } from '../components/GameScreen'
import { useAction } from '../hooks/useAction'
import { Panel } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { WaitingRow } from '../components/Screen'
import { VoteBar } from '../components/VoteBar'
import { crownedUids, showScores } from '../lib/game'
import { formatPrompt } from '../lib/prompts'
import { cn } from '../lib/cn'

export interface RevealScreenProps extends GameProps {
  /** Live ballot counts, used only until the frozen round/tally arrives. */
  liveCounts: Record<string, number>
}

export default function RevealScreen(props: RevealScreenProps) {
  const { code, uid, isHost, hostUid, round, displayRound, players, kicked, liveCounts, onLeave } = props
  const { busy, run } = useAction()

  const counts = round.tally ?? liveCounts
  const crowned = new Set(crownedUids(counts))
  const ids = new Set([...Object.keys(round.eligible ?? {}), ...Object.keys(counts)])
  const rows = [...ids]
    .filter((pid) => players?.[pid] && !kicked?.[pid])
    .map((pid) => ({ pid, p: players![pid], votes: counts[pid] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.p.joinNumber - b.p.joinNumber)
  const max = Math.max(1, ...rows.map((r) => r.votes))
  const total = rows.reduce((n, r) => n + r.votes, 0)

  return (
    <GameScreen
      label={`Round ${displayRound} · Results`}
      isHost={isHost}
      onLeave={onLeave}
      footer={
        isHost ? (
          <Button
            fullWidth
            disabled={busy}
            onClick={() => run(() => showScores(code, round.number), 'Could not show the scores.')}
          >
            Scores
          </Button>
        ) : (
          <WaitingRow />
        )
      }
    >
      <PromptText small>{formatPrompt(round.text)}</PromptText>

      {total === 0 && (
        <p className="text-base text-cream/60">No votes this round, so nobody gets a crown.</p>
      )}
      {crowned.size > 1 && (
        <p className="font-display text-sm font-bold tracking-[0.15em] text-gold uppercase">
          It's a tie! {crowned.size} crowns
        </p>
      )}

      <ul className="flex flex-col gap-3" aria-label="Votes per player">
        {rows.map(({ pid, p, votes }) => {
          const isCrowned = crowned.has(pid)
          return (
            <li key={pid}>
              <Panel
                tone={isCrowned ? 'gold' : 'slate'}
                className={cn(
                  'flex flex-col gap-2 py-3 transition-opacity',
                  isCrowned ? 'shadow-glow-gold' : crowned.size > 0 && 'opacity-60',
                )}
              >
                <PlayerChip
                  name={p.name}
                  joinNumber={p.joinNumber}
                  isHost={pid === hostUid}
                  isYou={pid === uid}
                  crowned={isCrowned}
                  trailing={isCrowned ? <CrownBadge size="lg" /> : undefined}
                />
                <VoteBar
                  value={votes}
                  max={max}
                  crowned={isCrowned}
                  label={`Votes for ${p.name}`}
                />
              </Panel>
            </li>
          )
        })}
      </ul>
    </GameScreen>
  )
}
