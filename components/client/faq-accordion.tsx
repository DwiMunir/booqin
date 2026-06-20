'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icons'
import type { Faq } from '@/lib/content/landing'

export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-[14px] border border-[rgba(20,33,31,0.1)] bg-card"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-[18px] text-left"
            >
              <span className="text-[1.04rem] font-bold text-ink">{item.q}</span>
              <Icon
                name="chevronDown"
                strokeWidth={2}
                className={`size-5 flex-none text-teal transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen ? (
              <div className="px-5 pb-5 text-[0.98rem] leading-[1.55] text-muted">{item.a}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
