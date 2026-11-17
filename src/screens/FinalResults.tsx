// Final results after End Game: podium (top 3), full leaderboard, highlights from the
// anonymous ballots, then Play Again (host, everyone back to the lobby) or Leave.
import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { CrownBadge } from '../components/CrownBadge'
import { Divider } from '../components/Divider'
import { GameScreen, type GameProps } from '../components/GameScreen'
import { Panel, type PanelTone } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { WaitingRow } from '../components/Screen'
import { useAction } from '../hooks/useAction'
import { useDbValue } from '../hooks/useDbValue'
import { cn } from '../lib/cn'
import { computeHighlights, playAgain } from '../lib/game'
import { paths } from '../lib/model'
import { activePlayers } from '../lib/presence'
import { playFanfare } from '../lib/sound'

const PODIUM_TONE: Record<number, PanelTone> = { 1: 'gold', 2: 'cream', 3: 'sage' }
const STAGGER_MS = 120

/** Staggered rise-in; delays are ignored under reduced motion (global CSS). */
const rise = (i: number): { className: string; style: CSSProperties } => ({
  className: 'animate-rise-in',
  style: { animationDelay: `${i * STAGGER_MS}ms` },
})

/** Fanfare once per game end per tab (not again on reload). */
function useFinalFanfare(code: string, round: number, anyCrowns: boolean) {
  useEffect(() => {
    if (!anyCrowns) return
    const key = `whomst:final:${code}:r${round}`
    try {
      if (window.sessionStorage.getItem(key) === '1') return
      window.sessionStorage.setItem(key, '1')
    } catch {
      // Storage blocked: play anyway.
    }
    playFanfare()
  }, [code, round, anyCrowns])
}

export default function FinalResults(props: GameProps) {
  const { code, uid, isHost, hostUid, round, displayRound, gameBaseRound, players, kicked, scores } =
    props
  const { serverNow, onLeave } = props
  const { busy, run } = useAction()
  const ballots = useDbValue<Record<string, Record<string, string>>>(`${paths.room(code)}/ballots`)

  const sorted = activePlayers(players, serverNow, kicked)
    .map(([pid, p]) => ({ pid, p, crowns: scores?.[pid] ?? 0 }))
    .sort((a, b) => b.crowns - a.crowns || a.p.joinNumber - b.p.joinNumber)
  // Competition ranking: tied players share a rank (1, 1, 3).
  const rows = sorted.map((r) => ({ ...r, rank: 1 + sorted.filter((o) => o.crowns > r.crowns).length }))
  const anyCrowns = rows.some((r) => r.crowns > 0)
  const podium = rows.slice(0, 3).filter((r) => r.crowns > 0)

  const highlights = useMemo(
    () => computeHighlights(ballots.data, gameBaseRound, round.number),
    [ballots.data, gameBaseRound, round.number],
  )
  const nameOf = (pid: string) => players?.[pid]?.name ?? 'A player who left'
  const listNames = (names: string[]) =>
    names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  const topCrowns = rows[0]?.crowns ?? 0
  const mostCrowned = anyCrowns ? rows.filter((r) => r.crowns === topCrowns) : []
  useFinalFanfare(code, round.number, anyCrowns)

  return (
    <GameScreen
      label={`Game over · ${displayRound} round${displayRound === 1 ? '' : 's'}`}
      isHost={isHost}
      onLeave={onLeave}
      hideLeave
      footer={
        <>
          {isHost ? (
            <Button
              fullWidth
              disabled={busy}
              onClick={() => run(() => playAgain(code, round.number), 'Could not start over.')}
            >
              Play Again
            </Button>
          ) : (
            <WaitingRow />
          )}
          <Button variant="secondary" fullWidth onClick={onLeave}>
            Leave
          </Button>
        </>
      }
    >
      <h1 className="font-display text-2xl font-black tracking-wide uppercase">Final results</h1>

      {podium.length > 0 ? (
        <ol className="grid grid-cols-2 gap-3" aria-label="Podium">
          {podium.map(({ pid, p, crowns, rank }, i) => {
            const tone = PODIUM_TONE[rank] ?? 'slate'
            return (
              <li
                key={pid}
                className={cn(i === 0 && 'col-span-2', rise(i).className)}
                style={rise(i).style}
              >
                <Panel
                  tone={tone}
                  className={cn('flex flex-col gap-2', tone === 'gold' && 'shadow-glow-gold')}
                >
                  <p
                    className={cn(
                      'font-display text-sm font-bold tracking-[0.2em] uppercase',
                      tone === 'gold' ? 'text-gold' : tone === 'sage' ? 'text-sage' : 'text-cream',
                    )}
                  >
                    {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}
                  </p>
                  <PlayerChip
                    name={p.name}
                    joinNumber={p.joinNumber}
                    size={i === 0 ? 'lg' : 'md'}
                    crowned={tone === 'gold'}
                    isYou={pid === uid}
                  />
                  <span className="font-mono text-base font-bold text-cream">
                    {tone === 'gold' ? <CrownBadge size="md" count={crowns} /> : `x${crowns}`}
                  </span>
                </Panel>
              </li>
            )
          })}
        </ol>
      ) : (
        <Panel className="text-center">
          <p>No crowns this game.</p>
        </Panel>
      )}

      <Panel className={cn('flex flex-col gap-3', rise(3).className)} style={rise(3).style}>
        <Divider label="Leaderboard" />
        <ol className="flex flex-col gap-1">
          {rows.map(({ pid, p, crowns, rank }) => (
            <li key={pid} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-right font-mono text-sm font-bold text-cream/60">
                {rank}
              </span>
              <PlayerChip
                className="min-w-0 flex-1"
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
        </ol>
      </Panel>

      {(mostCrowned.length > 0 || highlights.landslide || highlights.ties > 0) && (
        <section
          className={cn('flex flex-col gap-3', rise(4).className)}
          style={rise(4).style}
          aria-label="Highlights"
        >
          <Divider label="Highlights" />
          {mostCrowned.length > 0 && (
            <Highlight title="Most crowned">
              {listNames(mostCrowned.map((r) => r.p.name))} · {topCrowns} crown
              {topCrowns === 1 ? '' : 's'}
            </Highlight>
          )}
          {highlights.landslide && (
            <Highlight title="Biggest landslide">
              {listNames(highlights.landslide.uids.map(nameOf))} got {highlights.landslide.votes}{' '}
              votes in round {highlights.landslide.round}
            </Highlight>
          )}
          {highlights.ties > 0 && (
            <Highlight title="Ties">
              {highlights.ties} round{highlights.ties === 1 ? '' : 's'} ended in a tie
            </Highlight>
          )}
        </section>
      )}
    </GameScreen>
  )
}

function Highlight({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel padded={false} className="flex flex-col gap-1 px-4 py-3">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">{title}</p>
      <p className="text-base">{children}</p>
    </Panel>
  )
}
