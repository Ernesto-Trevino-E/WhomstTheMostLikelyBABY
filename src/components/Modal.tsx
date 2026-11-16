import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Panel, type PanelTone } from './Panel'
import { CloseIcon } from './icons'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  tone?: PanelTone
  /** Hide the X button (e.g. a notice with a single OK action). */
  hideClose?: boolean
  children: ReactNode
  /** Buttons row at the bottom. */
  actions?: ReactNode
}

/** Centered panel over a dark overlay. Native <dialog>: focus trap, Esc to close, backdrop. */
export function Modal({ open, onClose, title, tone = 'slate', hideClose, children, actions }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes.
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[440px] bg-transparent p-0 text-cream open:animate-screen-in"
    >
      <Panel tone={tone} className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h2
            id={titleId}
            className={cn(
              'pt-3 font-display text-base font-bold tracking-[0.15em] uppercase',
              tone === 'sage' && 'text-sage',
              tone === 'red' && 'text-red',
            )}
          >
            {title}
          </h2>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-pill text-cream/60 hover:text-cream focus-visible:shadow-glow-orange focus-visible:outline-none"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <div className="text-base">{children}</div>
        {actions && <div className="flex flex-col gap-2 sm:flex-row-reverse">{actions}</div>}
      </Panel>
    </dialog>
  )
}
