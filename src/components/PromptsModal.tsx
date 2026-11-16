// Host-only prompt settings: stock category filter and the player-submissions toggle.
import { useState } from 'react'
import { STOCK_COUNTS } from '../data/prompts'
import { useToast } from '../hooks/useToast'
import { CATEGORIES, DEFAULT_SETTINGS, type Category, type RoomSettings } from '../lib/model'
import { updateSettings } from '../lib/rooms'
import { Button } from './Button'
import { Divider } from './Divider'
import { Modal } from './Modal'
import { Switch } from './Switch'

const LABELS: Record<Category, { name: string; blurb: string }> = {
  chill: { name: 'Chill', blurb: 'Light and silly' },
  cheeky: { name: 'Cheeky', blurb: 'Embarrassing, flirty, chaotic' },
  harsh: { name: 'Harsh', blurb: 'A little mean, with love' },
  gotcha: { name: 'Gotcha', blurb: 'Puts someone on the spot' },
}

export interface PromptsModalProps {
  open: boolean
  onClose: () => void
  code: string
  settings: RoomSettings | null
  /** Unused player submissions (count only; texts are never listed). */
  waiting: number
}

export function PromptsModal({ open, onClose, code, settings, waiting }: PromptsModalProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const s = settings ?? DEFAULT_SETTINGS
  const cats = { ...DEFAULT_SETTINGS.categories, ...s.categories }
  const onCount = CATEGORIES.filter((c) => cats[c]).length
  const stockOn = CATEGORIES.reduce((n, c) => n + (cats[c] ? STOCK_COUNTS[c] : 0), 0)

  async function save(patch: Partial<RoomSettings>) {
    setBusy(true)
    try {
      await updateSettings(code, patch)
    } catch {
      toast.show('Could not save. Check your connection.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prompts"
      actions={
        <Button fullWidth onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Divider label="Stock categories" />
        <div className="flex flex-col">
          {CATEGORIES.map((c) => (
            <Switch
              key={c}
              label={LABELS[c].name}
              detail={`${LABELS[c].blurb} · ${STOCK_COUNTS[c]}`}
              checked={cats[c]}
              // Keep at least one category on so the stock pool is never empty.
              disabled={busy || (cats[c] && onCount === 1)}
              onChange={(on) => save({ categories: { [c]: on } as RoomSettings['categories'] })}
            />
          ))}
        </div>
        <p className="text-sm text-cream/60">
          {stockOn} stock prompts on. At least one category stays on.
        </p>
        <Divider label="Player prompts" />
        <Switch
          label="Allow player prompts"
          detail="Anyone can add prompts. They are drawn first and stay anonymous."
          checked={s.allowSubmissions}
          disabled={busy}
          onChange={(on) => save({ allowSubmissions: on })}
        />
        <p className="text-sm text-cream/60">
          {waiting === 1 ? '1 player prompt waiting.' : `${waiting} player prompts waiting.`}
        </p>
      </div>
    </Modal>
  )
}
