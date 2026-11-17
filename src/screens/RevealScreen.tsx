// Reveal phase: votes per player (never who voted for whom), top player(s) crowned.
// The sequence (bars fill lowest first under a drumroll, pause, crown moment) runs once per
// tab; the host's Scores button unlocks when their own sequence has finished.
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Confetti } from '../components/Confetti'
import { CrownBadge } from '../components/CrownBadge'
import { GameScreen, PromptText, type GameProps } from '../components/GameScreen'
import { useAction } from '../hooks/useAction'
import { useCountUp } from '../hooks/useCountUp'
import { useRevealSequence } from '../hooks/useRevealSequence'
import { Panel } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { WaitingRow } from '../components/Screen'
import { VoteBar } from '../components/VoteBar'
import { crownedUids, showScores } from '../lib/game'
import type { Player } from '../lib/model'
import { formatPrompt } from '../lib/prompts'
import { cn } from '../lib/cn'

/** Live counts stand in for the frozen tally if it hasn't arrived by then. */
const TALLY_FALLBACK_MS = 1500

export interface RevealScreenProps extends GameProps {
  /** Live ballot counts, used only until the frozen round/tally arrives. */
  liveCounts: Record<string, number>
}

export default function RevealScreen(props: RevealScreenProps) {
  const { code, uid, isHost, hostUid, round, displayRound, players, kicked, liveCounts, onLeave } = props
  const { busy, run } = useAction()

  const [fallback, setFallback] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setFallback(true), TALLY_FALLBACK_MS)
    return () => window.clearTimeout(t)
  }, [])

  const counts = round.tally ?? liveCounts
  const crowned = new Set(crownedUids(counts))
  const ids = new Set([...Object.keys(round.eligible ?? {}), ...Object.keys(counts)])
  const rows = [...ids]
    .filter((pid) => players?.[pid] && !kicked?.[pid])
    .map((pid) => ({ pid, p: players![pid], votes: counts[pid] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.p.joinNumber - b.p.joinNumber)
  const max = Math.max(1, ...rows.map((r) => r.votes))
  const total = rows.reduce((n, r) => n + r.votes, 0)
  const voted = rows.filter((r) => r.votes > 0)

  const seq = useRevealSequence({
    code,
    round: round.number,
    votedRows: voted.length,
    hasCrown: crowned.size > 0,
    ready: Boolean(round.tally) || fallback,
  })
  const crownShown = seq.stage === 'crown' || seq.stage === 'done'
  const done = seq.stage === 'done'

  return (
    <GameScreen
      label={`Round ${displayRound} · Results`}
      isHost={isHost}
      onLeave={onLeave}
      footer={
        isHost ? (
          <Button
            fullWidth
            disabled={busy || !done}
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

      {done && total === 0 && (
        <p className="text-base text-cream/60">No votes this round, so nobody gets a crown.</p>
      )}
      {crownShown && crowned.size > 1 && (
        <p
          className={cn(
            'font-display text-sm font-bold tracking-[0.15em] text-gold uppercase',
            !seq.instant && 'animate-rise-in',
          )}
        >
          It's a tie! {crowned.size} crowns
        </p>
      )}

      <ul className="flex flex-col gap-3" aria-label="Votes per player">
        {rows.map(({ pid, p, votes }) => {
          // Voted rows fill from the lowest: the last voted row in this (descending) list is first.
          const fillOrder = voted.length - 1 - voted.findIndex((r) => r.pid === pid)
          return (
            <li key={pid}>
              <RevealRow
                player={p}
                votes={votes}
                max={max}
                filling={votes > 0 && fillOrder < seq.started}
                fillMs={seq.perRowMs}
                crowned={crowned.has(pid)}
                crownShown={crownShown}
                dim={crownShown && crowned.size > 0 && !crowned.has(pid)}
                animate={!seq.instant}
                isHost={pid === hostUid}
                isYou={pid === uid}
              />
            </li>
          )
        })}
      </ul>

      {crownShown && crowned.size > 0 && !seq.instant && <Confetti />}
    </GameScreen>
  )
}

export interface RevealRowProps {
  player: Player
  votes: number
  max: number
  /** This row's fill has started. */
  filling: boolean
  fillMs: number
  crowned: boolean
  crownShown: boolean
  dim: boolean
  animate: boolean
  isHost: boolean
  isYou: boolean
}

export function RevealRow(props: RevealRowProps) {
  const { player, votes, max, filling, fillMs, crowned, crownShown, dim, animate, isHost, isYou } = props
  const shown = useCountUp(votes, fillMs, filling)
  const gold = crowned && crownShown
  return (
    <Panel
      tone={gold ? 'gold' : 'slate'}
      className={cn(
        'flex flex-col gap-2 py-3 transition-opacity duration-300',
        gold && (animate ? 'animate-gold-flash' : 'shadow-glow-gold'),
        dim && 'opacity-60',
      )}
    >
      <PlayerChip
        name={player.name}
        joinNumber={player.joinNumber}
        isHost={isHost}
        isYou={isYou}
        crowned={gold}
        trailing={gold ? <CrownBadge size="lg" drop={animate} /> : undefined}
      />
      <VoteBar
        value={filling ? votes : 0}
        displayValue={shown}
        max={max}
        crowned={gold}
        durationMs={fillMs}
        label={`Votes for ${player.name}`}
      />
    </Panel>
  )
}
