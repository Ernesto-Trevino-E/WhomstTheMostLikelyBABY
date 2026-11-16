// Room codes: 4 uppercase letters, no look-alikes (no I, L, O and no digits).
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'
export const CODE_LENGTH = 4

export function generateCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

/** Uppercase and strip spaces/dashes, so " ab-cd " becomes "ABCD". */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '')
}

export function isValidCode(code: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(code)
}
