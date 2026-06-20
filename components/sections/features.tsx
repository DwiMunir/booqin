// SANITY (Fase 2): pageBuilder block `features`.
import { Reveal } from '@/components/client/reveal'
import { Icon } from '@/components/ui/icons'
import type { FeaturesBlock } from '@/lib/cms/types'

export function Features({ block }: { block: FeaturesBlock }) {
  return (
    <section id="features" className="border-t border-[rgba(20,33,31,0.06)] bg-white">
      <div className="container-page py-[clamp(64px,8vw,108px)]">
        <Reveal className="mx-auto mb-[54px] max-w-[680px] text-center">
          <div className="mb-3.5 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-amber-dark">
            {block.eyebrow}
          </div>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.85rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance text-[#11231F]">
            {block.heading}
          </h2>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {block.items.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 70}>
              <div className="rounded-[18px] border border-[rgba(20,33,31,0.08)] bg-card p-[26px] transition hover:-translate-y-[3px] hover:shadow-[0_18px_36px_-22px_rgba(14,77,71,0.4)]">
                <div className="mb-4 flex size-[46px] items-center justify-center rounded-[12px] bg-teal-tint">
                  <Icon name={f.icon} className="size-[23px] text-teal" strokeWidth={1.7} />
                </div>
                <h3 className="mb-2 font-display text-[1.16rem] font-bold text-[#11231F]">
                  {f.title}
                </h3>
                <p className="text-[0.94rem] text-[#5C6A66]">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
