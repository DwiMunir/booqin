'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icons'
import type { NavLink } from '@/lib/content/landing'

// Hamburger + drawer (hanya tampil <820px lewat wrapper di SiteHeader).
export function MobileNav({ links, cta }: { links: NavLink[]; cta: NavLink }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-[42px] items-center justify-center rounded-[11px] border border-[rgba(20,33,31,0.12)] bg-white"
      >
        <Icon name="menu" className="size-[22px] text-brand" />
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-[63px] z-50 flex flex-col gap-1 border-t border-[rgba(20,33,31,0.07)] bg-[rgba(250,247,241,0.97)] px-6 pb-[18px] pt-2.5 backdrop-blur">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-[rgba(20,33,31,0.06)] px-1 py-3 font-semibold text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href={cta.href}
            onClick={() => setOpen(false)}
            className="mt-2 rounded-[11px] bg-amber py-3.5 text-center font-bold text-[#1c1206]"
          >
            {cta.label}
          </a>
        </div>
      ) : null}
    </>
  )
}
