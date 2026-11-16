// Vote phase: pick one player (yourself included) and Lock In. Afterwards only counts are
// shown ("x / n VOTED"). Everyone can add a prompt mid-round; the host can end voting early.
import { useState } from 'react'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { GameScreen, PromptText, type GameProps } from '../components/GameScreen'
import { useAction } from '../hooks/useAction'
import { Modal } from '../components/Modal'
import { Panel } from '../components/Panel'
import { PromptSubmitForm } from '../components/PromptSubmitForm'
import { WaitingRow } from '../components/Screen'
import { VoteBar } from '../components/VoteBar'
import { VoteCard } from '../components/VoteCard'
import { DEFAULT_SETTINGS } from '../lib/model'
import { eligiblePlayers, endVoting } from '../lib/game'
import { formatPrompt } from '../lib/prompts'
import { castVote } from '../lib/votes'

export interface VoteScreenProps extends GameProps {
  /** voted/r{n}: who has voted (never for whom). */
  voted: Record<string, true> | null
}

export default function VoteScreen(props: VoteScreenProps) {
  const { code, uid, isHost, round, displayRound, players, kicked, serverNow, settings, prompts, voted, onLeave } =
    props
  const vote = useAction()
  const end = useAction()
  const [selected, setSelected] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const options = eligiblePlayers(round, players, serverNow, kicked)
  const canVote = Boolean(round.eligible?.[uid])
  const hasVoted = Boolean(voted?.[uid])
  const locked = !canVote || hasVoted || vote.busy
  const votedCount = options.filter(([pid]) => voted?.[pid]).length
  const selectionValid = selected !== null && options.some(([pid]) => pid === selected)
  const allowSubmissions = (settings ?? DEFAULT_SETTINGS).allowSubmissions

  function lockIn() {
    if (!selected || !selectionValid) return
    void vote.run(() => castVote(code, round.number, uid, selected), 'Could not lock in your vote.')
  }

  return (
    <GameScreen
      label={`Round ${displayRound} · Vote`}
      isHost={isHost}
      onLeave={onLeave}
      footer={
        <>
          {canVote && !hasVoted && (
            <Button fullWidth disabled={!selectionValid || vote.busy} onClick={lockIn}>
              {vote.busy ? 'Locking in...' : 'Lock In'}
            </Button>
          )}
          {isHost && (
            <Button
              variant="danger-outline"
              fullWidth
              disabled={end.busy}
              onClick={() => end.run(() => endVoting(code, round.number), 'Could not end voting.')}
            >
              End Voting
            </Button>
          )}
          <Button variant="secondary" size="sm" fullWidth onClick={() => setAddOpen(true)}>
            Add a prompt
          </Button>
        </>
      }
    >
      <PromptText small>{formatPrompt(round.text)}</PromptText>

      {!canVote && (
        <Banner>You joined mid-round. You're in from the next prompt.</Banner>
      )}

      {(hasVoted || !canVote) && (
        <Panel tone="sage" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-sm font-bold tracking-[0.15em] text-sage uppercase">
              {hasVoted ? 'Vote locked in' : 'Watching this round'}
            </p>
            <p className="font-mono text-base font-bold text-cream">
              {votedCount} / {options.length} VOTED
            </p>
          </div>
          <VoteBar value={votedCount} max={options.length} showCount={false} label="Players voted" />
          {!isHost && <WaitingRow label="Waiting for votes" />}
        </Panel>
      )}

      {/* Disabled cards dim themselves once voting is locked. */}
      <ul aria-label="Players" className="grid grid-cols-2 gap-3">
        {options.map(([pid, p]) => (
          <li key={pid}>
            <VoteCard
              name={p.name}
              joinNumber={p.joinNumber}
              isYou={pid === uid}
              selected={!hasVoted && selected === pid}
              disabled={locked}
              onSelect={() => setSelected(pid)}
            />
          </li>
        ))}
      </ul>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a prompt">
        {addOpen && (
          <PromptSubmitForm
            code={code}
            uid={uid}
            allowed={allowSubmissions}
            prompts={prompts}
            onSubmitted={() => setAddOpen(false)}
          />
        )}
      </Modal>
    </GameScreen>
  )
}
