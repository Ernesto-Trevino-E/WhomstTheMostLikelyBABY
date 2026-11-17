// Shared frame for the in-game screens: "ROUND n" header with Leave (and its confirm modal),
// the content, and a sticky bottom bar for host controls or the waiting row.
import { useState, type ReactNode } from 'react'
import type { Player, Round, RoomSettings, SubmittedPrompt } from '../lib/model'
import { Button } from './Button'
import { Modal } from './Modal'
import { Screen } from './Screen'

/** What every in-game screen gets from Room. */
export interface GameProps {
  code: string
  uid: string
  isHost: boolean
  hostUid: string | null
  round: Round
  /** Round number within the current game (round.number - gameBaseRound). */
  displayRound: number
  /** meta.gameBaseRound: rounds after it belong to this game. */
  gameBaseRound: number
  players: Record<string, Player> | null
  kicked: Record<string, true> | null
  scores: Record<string, number> | null
  settings: RoomSettings | null
  prompts: Record<string, SubmittedPrompt> | null
  serverNow: number
  onLeave: () => void
}

export interface GameScreenProps {
  label: string
  isHost: boolean
  onLeave: () => void
  children: ReactNode
  /** Sticky bottom area (host buttons or WaitingRow). */
  footer?: ReactNode
  /** Hide the header Leave (when the footer has its own). */
  hideLeave?: boolean
}

export function GameScreen({ label, isHost, onLeave, children, footer, hideLeave }: GameScreenProps) {
  const [leaveOpen, setLeaveOpen] = useState(false)
  return (
    <Screen className="gap-5">
      {/* pr-14 keeps Leave clear of the corner mute toggle */}
      <header className="flex min-h-12 items-center justify-between gap-4 pr-14">
        <p className="font-display text-sm font-bold tracking-[0.2em] text-sage uppercase">
          {label}
        </p>
        {!hideLeave && (
          <Button variant="ghost" size="sm" onClick={() => setLeaveOpen(true)}>
            Leave
          </Button>
        )}
      </header>

      {children}

      {footer && (
        <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-3 bg-space/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave game?"
        actions={
          <>
            <Button variant="danger" fullWidth onClick={onLeave}>
              Leave
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setLeaveOpen(false)}>
              Stay
            </Button>
          </>
        }
      >
        <p>
          {isHost
            ? 'The host role passes to the next player. Your crowns are lost.'
            : 'You can rejoin with the code, but as a new player with 0 crowns.'}
        </p>
      </Modal>
    </Screen>
  )
}

/** The prompt text style from the brief (Orbitron 700, clamp 1.5–2.5rem). */
export function PromptText({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <p
      className={
        small
          ? 'font-display text-lg leading-snug font-bold text-cream'
          : 'font-display text-[clamp(1.5rem,6vw,2.5rem)] leading-tight font-bold break-words text-cream'
      }
    >
      {children}
    </p>
  )
}
