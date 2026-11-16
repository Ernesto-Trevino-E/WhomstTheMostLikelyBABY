// Prompt text helpers and player submissions. Prompts are stored as the ending only;
// the app adds the lead-in. Limits are client-enforced (rules cap the length at 80).
import { get, push, serverTimestamp } from 'firebase/database'
import { STOCK_PROMPTS } from '../data/prompts'
import { PROMPT_CAP, PROMPT_MAX, dbRef, paths, type SubmittedPrompt } from './model'

export const PROMPT_LEAD = "Who's most likely to"

/** "fall asleep at a party" -> "Who's most likely to fall asleep at a party?" */
export function formatPrompt(ending: string): string {
  return `${PROMPT_LEAD} ${ending}?`
}

const LEAD_RE = /^(who['’]?s|who is)\s+most\s+likely\s+to\s+/i

/**
 * Trim, collapse spaces, drop a pasted lead-in and trailing punctuation, and lowercase a
 * capitalised first word ("Fall asleep?" -> "fall asleep"). Acronyms like "GPS" are kept.
 */
export function cleanPromptText(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ').replace(LEAD_RE, '')
  text = text.replace(/[\s?.!…]+$/u, '')
  if (/^[A-Z][a-z]/.test(text)) text = text[0].toLowerCase() + text.slice(1)
  return text
}

/** Normalised text for duplicate checks. */
export function promptKey(text: string): string {
  return cleanPromptText(text)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}' ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOCK_KEYS = new Set(STOCK_PROMPTS.map((p) => promptKey(p.text)))

export type PromptErrorCode = 'EMPTY' | 'TOO_LONG' | 'CAP_REACHED' | 'DUPLICATE' | 'DISABLED'

const MESSAGES: Record<PromptErrorCode, string> = {
  EMPTY: 'Type how the question ends.',
  TOO_LONG: `Keep it to ${PROMPT_MAX} characters.`,
  CAP_REACHED: `You already have ${PROMPT_CAP} prompts waiting. Wait for some to be played.`,
  DUPLICATE: 'That prompt is already in the deck.',
  DISABLED: 'The host has turned off player prompts.',
}

export class PromptError extends Error {
  readonly code: PromptErrorCode
  constructor(code: PromptErrorCode) {
    super(MESSAGES[code])
    this.code = code
    this.name = 'PromptError'
  }
}

/** My unused submissions in the pool. */
export function waitingCount(
  prompts: Record<string, SubmittedPrompt> | null | undefined,
  uid: string,
): number {
  return Object.values(prompts ?? {}).filter((p) => p.authorUid === uid && !p.used).length
}

/** Unused submissions from everyone (shown as a count only). */
export function waitingTotal(prompts: Record<string, SubmittedPrompt> | null | undefined): number {
  return Object.values(prompts ?? {}).filter((p) => !p.used).length
}

/** Validate a submission against the current pool. Throws PromptError. Returns the clean text. */
export function validateSubmission(
  raw: string,
  uid: string,
  prompts: Record<string, SubmittedPrompt> | null | undefined,
): string {
  const text = cleanPromptText(raw)
  if (text.length === 0) throw new PromptError('EMPTY')
  if (text.length > PROMPT_MAX) throw new PromptError('TOO_LONG')
  const key = promptKey(text)
  if (STOCK_KEYS.has(key) || Object.values(prompts ?? {}).some((p) => p.key === key)) {
    throw new PromptError('DUPLICATE')
  }
  if (waitingCount(prompts, uid) >= PROMPT_CAP) throw new PromptError('CAP_REACHED')
  return text
}

/** Add a player prompt to the room's pool (anonymous: the author is never shown). */
export async function submitPrompt(code: string, uid: string, raw: string): Promise<string> {
  const allowed = await get(dbRef(`${paths.settings(code)}/allowSubmissions`))
  if (allowed.val() === false) throw new PromptError('DISABLED')
  const snap = await get(dbRef(paths.prompts(code)))
  const prompts = snap.val() as Record<string, SubmittedPrompt> | null
  const text = validateSubmission(raw, uid, prompts)
  await push(dbRef(paths.prompts(code)), {
    text,
    key: promptKey(text),
    authorUid: uid,
    used: false,
    createdAt: serverTimestamp(),
  })
  return text
}
