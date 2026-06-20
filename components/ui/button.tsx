import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/icons'

// Pill CTA amber (anchor untuk navigasi anchor di halaman yang sama).
export function CtaAnchor({
  href = '#waitlist',
  children = 'Join the waitlist',
  size = 'sm',
  withArrow = false,
  className = '',
}: {
  href?: string
  children?: ReactNode
  size?: 'sm' | 'lg'
  withArrow?: boolean
  className?: string
}) {
  const sizing =
    size === 'lg'
      ? 'gap-2 rounded-[13px] px-6 py-[15px] text-base shadow-[0_7px_18px_rgba(224,148,46,0.36)] hover:shadow-[0_10px_22px_rgba(224,148,46,0.44)]'
      : 'gap-[7px] rounded-[11px] px-[18px] py-2.5 text-[0.95rem] shadow-[0_5px_14px_rgba(224,148,46,0.34)] hover:shadow-[0_8px_18px_rgba(224,148,46,0.42)]'
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center bg-amber font-bold text-[#1c1206] transition duration-150 hover:-translate-y-px hover:bg-amber-dark ${sizing} ${className}`}
    >
      {children}
      {withArrow ? <Icon name="arrowRight" className="size-[18px]" strokeWidth={2} /> : null}
    </a>
  )
}
