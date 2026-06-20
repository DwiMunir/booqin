import type { ReactNode } from 'react'

// Ikon = inline SVG (nol dependensi, pixel-faithful ke desain). Warna via currentColor.
export type IconName =
  | 'message'
  | 'user'
  | 'calendar'
  | 'checkCircle'
  | 'refresh'
  | 'help'
  | 'mailOpen'
  | 'clock'
  | 'calendarX'
  | 'calendarCheck'
  | 'card'
  | 'chart'
  | 'buildings'
  | 'bell'
  | 'arrowRight'
  | 'check'
  | 'chevronDown'
  | 'menu'

const paths: Record<IconName, ReactNode> = {
  message: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />,
  user: (
    <>
      <path d="M16 18a4 4 0 0 0-8 0" />
      <circle cx="12" cy="8" r="3.2" />
      <path d="M4 18a4 4 0 0 1 3-3.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M9 12.5l2 2 4.5-5" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  refresh: (
    <>
      <path d="M4 11a8 8 0 0 1 13.5-5.5L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 13a8 8 0 0 1-13.5 5.5L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.25-.7.6-.7 1.1" />
      <path d="M12 16.5h.01" />
    </>
  ),
  mailOpen: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
      <circle cx="19" cy="6" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  calendarX: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      <path d="M12 12.5v3M12 18h.01" />
    </>
  ),
  calendarCheck: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      <path d="M8 13l2.5 2.5L16 11" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <path d="M6 15h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <rect x="7.5" y="12" width="3" height="5" />
      <rect x="12.5" y="8" width="3" height="9" />
      <rect x="17" y="14.5" width="3" height="2.5" />
    </>
  ),
  buildings: (
    <>
      <rect x="3" y="8" width="8" height="12" rx="1" />
      <rect x="13" y="4" width="8" height="16" rx="1" />
      <path d="M6 12h2M6 15h2M16 8h2M16 11h2M16 14h2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7Z" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4 4L19 7" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
}

export function Icon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
