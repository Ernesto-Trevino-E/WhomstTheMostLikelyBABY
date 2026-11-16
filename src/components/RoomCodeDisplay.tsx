import { useEffect, useRef, useState } from 'react'
import { Panel } from './Panel'
import { Button } from './Button'
import { CheckIcon, CopyIcon, ShareIcon } from './icons'

export interface RoomCodeDisplayProps {
  code: string
  /** Link to share; defaults to the current page URL. */
  shareUrl?: string
}

const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export function RoomCodeDisplay({ code, shareUrl }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const flashCopied = () => {
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      flashCopied()
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Nothing else to do.
    }
  }

  const share = async () => {
    const url = shareUrl ?? window.location.href
    try {
      await navigator.share({ title: 'Whomst the Most?', text: `Join my room: ${code}`, url })
    } catch {
      // User cancelled or share failed; ignore.
    }
  }

  return (
    <Panel variant="double" className="flex flex-col items-center gap-4 text-center">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-sage uppercase">
        Room code
      </p>
      <p
        className="font-mono text-5xl font-bold tracking-[0.3em] text-cream pl-[0.3em]"
        aria-label={`Room code ${code.split('').join(' ')}`}
      >
        {code}
      </p>
      <div className="flex w-full flex-wrap justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={copy}
          icon={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        >
          <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
        </Button>
        {canShare() && (
          <Button variant="secondary" size="sm" onClick={share} icon={<ShareIcon size={16} />}>
            Share
          </Button>
        )}
      </div>
    </Panel>
  )
}
