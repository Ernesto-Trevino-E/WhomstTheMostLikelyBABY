// Player prompt submission: the ending only, with the lead-in shown as fixed text.
// Used in the lobby now and in the Vote screen's "Add a prompt" modal in Phase 4.
import { useState, type FormEvent } from 'react'
import { useToast } from '../hooks/useToast'
import { PROMPT_CAP, PROMPT_MAX, type SubmittedPrompt } from '../lib/model'
import {
  PROMPT_LEAD,
  PromptError,
  cleanPromptText,
  submitPrompt,
  waitingCount,
} from '../lib/prompts'
import { Button } from './Button'
import { AlertIcon } from './icons'

export interface PromptSubmitFormProps {
  code: string
  uid: string
  /** Host setting; when false the form is disabled with a note. */
  allowed: boolean
  prompts: Record<string, SubmittedPrompt> | null | undefined
  /** Called after a successful submit (e.g. close the modal). */
  onSubmitted?: () => void
}

export function PromptSubmitForm({ code, uid, allowed, prompts, onSubmitted }: PromptSubmitFormProps) {
  const toast = useToast()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const clean = cleanPromptText(value)
  const mine = waitingCount(prompts, uid)
  const full = mine >= PROMPT_CAP
  const over = clean.length > PROMPT_MAX

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await submitPrompt(code, uid, value)
      setValue('')
      toast.show('Prompt added. Nobody will know it was you.', 'info')
      onSubmitted?.()
    } catch (err) {
      if (err instanceof PromptError) setError(err.message)
      else toast.show('Could not add the prompt. Check your connection.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!allowed) {
    return (
      <p className="text-base text-cream/60">The host has turned off player prompts for now.</p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <label
        htmlFor="prompt-ending"
        className="font-display text-sm font-bold tracking-[0.15em] text-sage uppercase"
      >
        {PROMPT_LEAD}...
      </label>
      <div className="flex items-center gap-2">
        <input
          id="prompt-ending"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder="fall asleep at a party"
          autoComplete="off"
          enterKeyHint="send"
          maxLength={PROMPT_MAX + 40}
          disabled={full}
          aria-invalid={error || over ? true : undefined}
          aria-describedby="prompt-msg"
          className={`min-h-12 w-full min-w-0 rounded-chip border-2 bg-space px-4 text-base text-cream placeholder:text-cream/40 focus:outline-none focus-visible:shadow-glow-orange disabled:opacity-50 ${
            error || over ? 'border-red' : 'border-slate focus:border-orange'
          }`}
        />
        <span aria-hidden className="font-display text-2xl font-black text-cream/60">
          ?
        </span>
      </div>
      <div id="prompt-msg" className="flex flex-col gap-1">
        {error && (
          <p role="alert" className="flex items-start gap-2 text-base text-red">
            <AlertIcon size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        <p className="flex justify-between gap-4 text-sm text-cream/60">
          <span>
            {full
              ? `You have ${PROMPT_CAP} waiting. Wait for some to be played.`
              : `${mine} / ${PROMPT_CAP} of yours waiting · anonymous`}
          </span>
          <span className={over ? 'font-bold text-red' : undefined}>
            {clean.length} / {PROMPT_MAX}
          </span>
        </p>
      </div>
      <Button type="submit" variant="secondary" fullWidth disabled={busy || full || clean.length === 0 || over}>
        {busy ? 'Adding...' : 'Add prompt'}
      </Button>
    </form>
  )
}
