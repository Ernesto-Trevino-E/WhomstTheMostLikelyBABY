// Small inline SVG icon set. Icons inherit `currentColor` and are decorative by default.
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.25,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...rest,
  }
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M3 8.5 7.5 12 12 5l4.5 7L21 8.5 19 18H5L3 8.5Z" />
      <rect x="5" y="19" width="14" height="2.2" rx="1" />
    </svg>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

export function SpeakerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4v-5Z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  )
}

export function SpeakerOffIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4v-5Z" fill="currentColor" />
      <path d="m16 9.5 5 5" />
      <path d="m21 9.5-5 5" />
    </svg>
  )
}

export function SignalIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 19v-2" />
      <path d="M10 19v-5" />
      <path d="M15 19v-8" />
      <path d="M20 19V7" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.5v.01" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.5v.01" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

export function KickIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="m17 9 4 4" />
      <path d="m21 9-4 4" />
    </svg>
  )
}
