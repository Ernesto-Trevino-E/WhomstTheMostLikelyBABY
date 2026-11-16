// Prompt phase: the drawn prompt for everyone; the host taps Start voting.
import { Button } from '../components/Button'
import { GameScreen, PromptText, type GameProps } from '../components/GameScreen'
import { useAction } from '../hooks/useAction'
import { Panel } from '../components/Panel'
import { WaitingRow } from '../components/Screen'
import { startVoting } from '../lib/game'
import { formatPrompt } from '../lib/prompts'

export default function PromptScreen({ code, isHost, round, displayRound, onLeave }: GameProps) {
  const { busy, run } = useAction()
  return (
    <GameScreen
      label={`Round ${displayRound}`}
      isHost={isHost}
      onLeave={onLeave}
      footer={
        isHost ? (
          <Button
            fullWidth
            disabled={busy}
            onClick={() => run(() => startVoting(code, round.number), 'Could not start voting.')}
          >
            Start voting
          </Button>
        ) : (
          <WaitingRow />
        )
      }
    >
      <div className="flex flex-1 flex-col justify-center">
        <Panel variant="double" className="text-center">
          <PromptText>{formatPrompt(round.text)}</PromptText>
        </Panel>
      </div>
    </GameScreen>
  )
}
