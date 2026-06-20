// SANITY (Fase 2): pageBuilder block `howItWorks`.
import { Reveal } from '@/components/client/reveal'
import type { HowItWorksBlock } from '@/lib/cms/types'

export function HowItWorks({ block }: { block: HowItWorksBlock }) {
  return (
    <section id="how" className="bg-cream">
      <div className="container-page py-[clamp(64px,8vw,108px)]">
        <Reveal className="mx-auto mb-[54px] max-w-[680px] text-center">
          <div className="mb-3.5 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-amber-dark">
            {block.eyebrow}
          </div>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.85rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-[#11231F]">
            {block.heading}
          </h2>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[22px]">
          {block.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="rounded-[18px] border border-[rgba(20,33,31,0.08)] bg-white p-[30px]">
                <div className="mb-[18px] flex items-center gap-[13px]">
                  <span
                    className={`flex size-[42px] items-center justify-center rounded-[12px] font-display text-[1.15rem] font-extrabold ${s.accent === 'amber' ? 'bg-amber text-[#1c1206]' : 'bg-brand text-white'}`}
                  >
                    {i + 1}
                  </span>
                  <span className="h-px flex-1 bg-[rgba(20,33,31,0.1)]" />
                </div>
                <h3 className="mb-[9px] font-display text-[1.28rem] font-bold text-[#11231F]">
                  {s.title}
                </h3>
                <p className="text-[0.98rem] text-[#5C6A66]">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
