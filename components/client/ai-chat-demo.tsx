'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icons'
import type { ChatMessage } from '@/lib/content/landing'

// Chat animasi: auto-play berurutan saat ter-scroll masuk. Reduced-motion → tampil sekaligus.
export function AiChatDemo({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(messages.length)
      return
    }

    let cancelled = false
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
    async function play() {
      for (let i = 0; i < messages.length; i++) {
        if (cancelled) return
        const m = messages[i]
        if (!m) return
        if (m.from === 'ai') {
          setTyping(true)
          await sleep(1150)
          if (cancelled) return
          setTyping(false)
        } else {
          await sleep(420)
        }
        if (cancelled) return
        setShown(i + 1)
        await sleep(m.from === 'ai' ? 650 : 480)
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true
            void play()
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [messages])

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-[22px] border border-white/10 bg-brand-dark shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center gap-[11px] border-b border-white/[0.08] bg-white/[0.04] px-[18px] py-4">
        <span className="flex size-[38px] items-center justify-center rounded-[11px] bg-teal">
          <Icon name="message" className="size-5 text-white" />
        </span>
        <div className="flex-1">
          <div className="font-extrabold text-white">Booqin Assistant</div>
          <div className="flex items-center gap-1.5 text-[0.76rem] font-bold text-[#8FC9BF]">
            <span className="animate-booq-pulse size-[7px] rounded-full bg-[#5BD0BB]" />
            Online · typically replies instantly
          </div>
        </div>
      </div>

      <div className="flex min-h-[330px] flex-col gap-[13px] p-[18px]">
        {messages.slice(0, shown).map((m) =>
          m.from === 'guest' ? (
            <div key={m.text} className="animate-booq-in max-w-[82%] self-end">
              <div className="rounded-[16px_16px_5px_16px] bg-[#F0EAD9] px-[14px] py-[11px] text-[0.95rem] text-[#16302C]">
                {m.text}
              </div>
              <div className="mt-1 text-right text-[0.7rem] text-[#7FA8A0]">{m.name}</div>
            </div>
          ) : (
            <div key={m.text} className="animate-booq-in max-w-[86%] self-start">
              <div className="rounded-[16px_16px_16px_5px] bg-teal px-[14px] py-[11px] text-[0.95rem] text-white">
                {m.text}
              </div>
            </div>
          ),
        )}
        {typing ? (
          <div className="flex items-center gap-[5px] self-start rounded-[16px_16px_16px_5px] bg-teal px-4 py-[13px]">
            <span className="animate-booq-dot size-[7px] rounded-full bg-[#bfe9e1]" />
            <span
              className="animate-booq-dot size-[7px] rounded-full bg-[#bfe9e1]"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="animate-booq-dot size-[7px] rounded-full bg-[#bfe9e1]"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
