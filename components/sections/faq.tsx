// SANITY (Fase 2): pageBuilder block `faq`. JSON-LD FAQPage di-emit dari data yang sama.
import { FaqAccordion } from '@/components/client/faq-accordion'
import { Reveal } from '@/components/client/reveal'
import type { FaqBlock } from '@/lib/cms/types'
import { FaqPageJsonLd } from '@/lib/seo/jsonld'

export function Faq({ block }: { block: FaqBlock }) {
  return (
    <section id="faq" className="border-t border-[rgba(20,33,31,0.06)] bg-white">
      <FaqPageJsonLd faqs={block.items} />
      <div className="container-narrow py-[clamp(64px,8vw,104px)]">
        <Reveal className="mb-11 text-center">
          <div className="mb-3.5 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-amber-dark">
            {block.eyebrow}
          </div>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#11231F]">
            {block.heading}
          </h2>
        </Reveal>
        <Reveal>
          <FaqAccordion items={block.items} />
        </Reveal>
      </div>
    </section>
  )
}
