// Dev-only component gallery (open /#gallery in `npm run dev`).
// Shows every reusable component and state from styling brief 4.4. No Firebase.
import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { PlayerChip } from '../components/PlayerChip'
import { VoteCard } from '../components/VoteCard'
import { VoteBar } from '../components/VoteBar'
import { RoomCodeDisplay } from '../components/RoomCodeDisplay'
import { CrownBadge } from '../components/CrownBadge'
import { Modal } from '../components/Modal'
import { Toast } from '../components/Toast'
import { Divider } from '../components/Divider'
import { Banner } from '../components/Banner'
import { MuteToggle } from '../components/MuteToggle'
import { Sparkle } from '../components/Sparkle'
import { ScreenTransition } from '../components/ScreenTransition'
import { KickIcon } from '../components/icons'
import { useToast } from '../hooks/useToast'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { PLAYER_COLORS, initials, playerColor } from '../lib/players'

const NAMES = [
  'Ana',
  'Bob Ross',
  'Q',
  'Maximiliana Bartholomew-Featherstonehaugh',
  'Dee 🎉',
  'Lu Xin',
  'Sam',
  'Priya K',
  'Oz',
  'Jo March',
  'Eleven',
  'Twelve Cycle',
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <Divider label={title} />
      {children}
    </section>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-sm text-cream/60">{children}</p>
}

export default function Gallery() {
  const toast = useToast()
  const reduced = usePrefersReducedMotion()
  const [selected, setSelected] = useState<number | null>(2)
  const [muted, setMuted] = useState(false)
  const [modal, setModal] = useState<null | 'prompts' | 'kick' | 'lobby'>(null)
  const [replay, setReplay] = useState(0)
  const [bars, setBars] = useState([5, 5, 3, 1, 0])

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-10 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-black tracking-wide uppercase">
            Gallery <Sparkle size={20} color="var(--color-orange)" />
          </h1>
          <Caption>Dev only. Reduced motion: {reduced ? 'on' : 'off'}.</Caption>
        </div>
        <MuteToggle muted={muted} onToggle={() => setMuted((m) => !m)} />
      </header>

      <Section title="Button">
        <Button fullWidth>Create Room</Button>
        <Button variant="secondary" fullWidth>
          Join Room
        </Button>
        <Button variant="danger" fullWidth>
          End Game
        </Button>
        <Button variant="ghost">Back</Button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="sm" variant="danger">
            Kick
          </Button>
        </div>
        <Button fullWidth disabled>
          Start Game
        </Button>
        <Caption>Disabled primary ("Need 4 players"). Hover/press shows the texture.</Caption>
      </Section>

      <Section title="Panel">
        <Panel>Single panel, 2px slate outline.</Panel>
        <Panel variant="double" className="text-center">
          <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">
            Round 3
          </p>
          <p className="mt-2 font-display text-[clamp(1.5rem,6vw,2.5rem)] leading-tight font-bold">
            Who's most likely to forget their own birthday?
          </p>
        </Panel>
        <Panel tone="sage">Sage tone (info / notices).</Panel>
        <Panel tone="red">Red tone (danger / alerts).</Panel>
        <Panel tone="gold" className="shadow-glow-gold">
          Gold tone + glow (crown treatment only).
        </Panel>
      </Section>

      <Section title="PlayerChip">
        <Panel className="flex flex-col gap-2">
          <PlayerChip name="Ana" joinNumber={1} isHost showNumber />
          <PlayerChip name="Bob Ross" joinNumber={2} isYou showNumber />
          <PlayerChip
            name="Q"
            joinNumber={3}
            disconnected
            showNumber
            trailing={
              <Button variant="ghost" size="sm" aria-label="Kick Q" className="text-red">
                <KickIcon size={20} />
              </Button>
            }
          />
          <PlayerChip name={NAMES[3]} joinNumber={4} showNumber />
          <PlayerChip name="Dee 🎉" joinNumber={5} crowned trailing={<CrownBadge count={3} />} />
          <PlayerChip name="Lu Xin" joinNumber={6} dimmed />
          <PlayerChip name="Sam" joinNumber={7} size="lg" isHost isYou />
        </Panel>
      </Section>

      <Section title="Player colors">
        <Caption>10 colors by join order, cycling after 10 (players 11 and 12 reuse 1 and 2).</Caption>
        <div className="flex flex-wrap gap-2">
          {NAMES.map((n, i) => (
            <span
              key={n}
              title={`#${i + 1} ${n}`}
              className="inline-flex size-11 items-center justify-center rounded-pill font-display text-sm font-black text-space"
              style={{ backgroundColor: playerColor(i + 1) }}
            >
              {initials(n)}
            </span>
          ))}
        </div>
        <Caption>Palette size: {PLAYER_COLORS.length}. Empty name initials: "{initials('   ')}".</Caption>
      </Section>

      <Section title="VoteCard">
        <div className="grid grid-cols-2 gap-3">
          {NAMES.slice(0, 5).map((n, i) => (
            <VoteCard
              key={n}
              name={n}
              joinNumber={i + 1}
              isYou={i === 1}
              selected={selected === i}
              onSelect={() => setSelected(i)}
            />
          ))}
          <VoteCard name="Disabled" joinNumber={6} disabled />
        </div>
        <Button fullWidth disabled={selected === null} onClick={() => toast.show('Vote locked in')}>
          Lock In
        </Button>
      </Section>

      <Section title="VoteBar">
        <Panel className="flex flex-col gap-3">
          {bars.map((v, i) => {
            const top = Math.max(...bars)
            const crowned = v === top && top > 0
            return (
              <div key={i} className="flex flex-col gap-1">
                <PlayerChip
                  name={NAMES[i]}
                  joinNumber={i + 1}
                  crowned={crowned}
                  dimmed={!crowned}
                />
                <VoteBar value={v} max={14} crowned={crowned} label={`Votes for ${NAMES[i]}`} />
              </div>
            )
          })}
        </Panel>
        <Caption>Tie: the two top rows are both crowned.</Caption>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setBars(bars.map(() => Math.floor(Math.random() * 8)))}
        >
          Randomize
        </Button>
        <VoteBar value={7} max={9} showCount={false} label="Voted" />
        <p className="text-center font-mono text-sm font-bold">7 / 9 VOTED</p>
      </Section>

      <Section title="RoomCodeDisplay">
        <RoomCodeDisplay code="WHMS" />
        <Caption>Share only appears where the browser supports it.</Caption>
      </Section>

      <Section title="CrownBadge">
        <div className="flex items-end gap-4">
          <CrownBadge size="sm" />
          <CrownBadge size="md" />
          <CrownBadge size="lg" />
          <CrownBadge count={3} />
          <CrownBadge size="md" glow={false} />
        </div>
      </Section>

      <Section title="Modal">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setModal('prompts')}>
            Prompts
          </Button>
          <Button size="sm" variant="danger" onClick={() => setModal('kick')}>
            Kick confirm
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setModal('lobby')}>
            Back to lobby
          </Button>
        </div>
      </Section>

      <Section title="Toast">
        <div className="flex flex-col items-start gap-2">
          <Toast message="Ana is now the host" />
          <Toast type="error" message="Couldn't reach the room" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => toast.show('Ana is now the host')}>
            Fire info
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => toast.show("Couldn't reach the room", 'error')}
          >
            Fire error
          </Button>
        </div>
        <Caption>Fired toasts appear at the top and disappear after 3 seconds.</Caption>
      </Section>

      <Section title="Divider">
        <Divider />
        <Divider tone="slate" style="dashed" />
        <Divider label="Players (5)" />
        <Divider label="Slate label" tone="slate" style="dashed" />
      </Section>

      <Section title="Banner">
        <Banner>You joined mid-round. You're in from the next prompt.</Banner>
        <Banner type="alert">
          <span className="font-display text-sm font-bold tracking-[0.15em] uppercase">
            Reconnecting...
          </span>
        </Banner>
      </Section>

      <Section title="Waiting row">
        <p className="flex items-center justify-center gap-3 font-display text-sm font-bold tracking-[0.15em] uppercase">
          Waiting for host
          <span className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 rounded-pill bg-sage animate-pulse-dot"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </p>
      </Section>

      <Section title="Sparkle">
        <div className="flex items-center gap-4">
          <Sparkle size={12} />
          <Sparkle size={24} color="var(--color-orange)" />
          <Sparkle size={36} color="var(--color-sage)" />
        </div>
      </Section>

      <Section title="ScreenTransition">
        <ScreenTransition screenKey={String(replay)}>
          <Panel>Screen #{replay + 1}: fades and slides up 8px over 180ms.</Panel>
        </ScreenTransition>
        <Button size="sm" variant="secondary" onClick={() => setReplay((r) => r + 1)}>
          Replay
        </Button>
      </Section>

      <Modal
        open={modal === 'prompts'}
        onClose={() => setModal(null)}
        title="Prompts"
        actions={
          <Button fullWidth onClick={() => setModal(null)}>
            Done
          </Button>
        }
      >
        <ul className="flex flex-col gap-2">
          <li>Who's most likely to become famous?</li>
          <li>Who's most likely to cry at a movie?</li>
          <li>Who's most likely to get lost in their own city?</li>
        </ul>
      </Modal>

      <Modal
        open={modal === 'kick'}
        onClose={() => setModal(null)}
        title="Kick player?"
        tone="red"
        actions={
          <>
            <Button variant="danger" fullWidth onClick={() => setModal(null)}>
              Kick
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setModal(null)}>
              Cancel
            </Button>
          </>
        }
      >
        Remove Q from the room?
      </Modal>

      <Modal
        open={modal === 'lobby'}
        onClose={() => setModal(null)}
        title="Back to lobby"
        tone="sage"
        hideClose
        actions={
          <Button fullWidth onClick={() => setModal(null)}>
            OK
          </Button>
        }
      >
        Not enough players. Back to the lobby to wait for more.
      </Modal>
    </main>
  )
}
