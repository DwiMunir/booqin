// SANITY (Fase 2): pageBuilder block `aiSpotlight`.
import { AiChatDemo } from '@/components/client/ai-chat-demo'
import { Reveal } from '@/components/client/reveal'
import { Icon } from '@/components/ui/icons'
import type { AiSpotlightBlock } from '@/lib/cms/types'

export function AiSpotlight({ block }: { block: AiSpotlightBlock }) {
  return (
    <section id="ai" className="relative overflow-hidden bg-brand text-[#EAF4F2]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 380px at 88% 0%, rgba(224,148,46,0.16), transparent 60%)',
        }}
      />
      <div className="container-page relative py-[clamp(64px,8vw,112px)]">
        <Reveal className="mb-12 max-w-[720px]">
          <div className="mb-3.5 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-amber-light">
            {block.eyebrow}
          </div>
          <h2 className="mb-4 font-display text-[clamp(1.95rem,3.8vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance text-white">
            {block.heading}
          </h2>
          <p className="text-[clamp(1.04rem,1.6vw,1.22rem)] text-[#BFD6D1]">{block.intro}</p>
        </Reveal>

        <div className="flex flex-wrap items-start gap-[clamp(28px,4vw,56px)]">
          <Reveal className="min-w-[300px] max-w-[540px] flex-1 basis-[380px]">
            <AiChatDemo messages={block.chat} />
          </Reveal>
          <Reveal delay={120} className="min-w-[280px] flex-1 basis-[320px]">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
              {block.capabilities.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-[13px] rounded-[14px] border border-white/[0.09] bg-white/[0.05] p-4"
                >
                  <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-[rgba(224,148,46,0.18)]">
                    <Icon name={c.icon} className="size-[19px] text-amber-light" />
                  </span>
                  <div>
                    <div className="mb-0.5 text-[0.98rem] font-bold text-white">{c.title}</div>
                    <div className="text-[0.86rem] text-[#9FC2BB]">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
