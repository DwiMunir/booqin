// SANITY (Fase 2): pageBuilder block `cta`.
import { Reveal } from '@/components/client/reveal'
import { WhitelistForm } from '@/components/client/whitelist-form'
import type { CtaBlock } from '@/lib/cms/types'

export function FinalCta({ block }: { block: CtaBlock }) {
  return (
    <section id="waitlist" className="relative overflow-hidden bg-brand text-[#EAF4F2]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(680px 380px at 15% 110%, rgba(224,148,46,0.18), transparent 60%), radial-gradient(620px 360px at 92% -10%, rgba(21,120,110,0.5), transparent 60%)',
        }}
      />
      <div className="container-narrow relative py-[clamp(64px,8vw,116px)] text-center">
        <Reveal>
          <h2 className="mb-4 font-display text-[clamp(2rem,4.2vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-balance text-white">
            {block.headingTop}
            <br />
            {block.headingBottom}
          </h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="mx-auto mb-8 max-w-[520px] text-[clamp(1.05rem,1.6vw,1.24rem)] text-[#BFD6D1]">
            {block.body}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <WhitelistForm variant="cta" trust={block.trust} />
        </Reveal>
      </div>
    </section>
  )
}
