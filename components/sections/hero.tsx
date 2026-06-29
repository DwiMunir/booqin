// SANITY (Fase 2): pageBuilder block `hero`.
import Image from 'next/image'
import { WhitelistForm } from '@/components/client/whitelist-form'
import { WhatsAppInline } from '@/components/sections/whatsapp-chat'
import type { HeroBlock } from '@/lib/cms/types'
import heroVenue from '../../public/hero-venue.jpg'

export function Hero({ block }: { block: HeroBlock }) {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 520px at 78% -8%, rgba(21,120,110,0.10), transparent 60%), radial-gradient(700px 420px at 6% 18%, rgba(224,148,46,0.08), transparent 60%)',
        }}
      />
      <div className="container-page relative flex flex-wrap items-center gap-[clamp(36px,5vw,64px)] pt-[clamp(48px,7vw,92px)] pb-[clamp(56px,7vw,96px)]">
        <div className="min-w-[300px] max-w-[600px] flex-1 basis-[440px]">
          <div className="mb-6 inline-flex items-center gap-[9px] rounded-full border border-[rgba(21,120,110,0.18)] bg-teal-tint px-[13px] py-[7px] text-[0.82rem] font-bold text-brand">
            <span className="animate-booq-pulse size-[7px] rounded-full bg-teal" />
            {block.badge}
          </div>
          <h1 className="mb-5 font-display text-[clamp(2.5rem,5.4vw,4.1rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance text-[#11231F]">
            Fill more dates.
            <br />
            Let your venue's
            <br />
            <span className="text-teal">AI assistant</span> do the booking.
          </h1>
          <p className="mb-[30px] max-w-[520px] text-[clamp(1.06rem,1.7vw,1.28rem)] text-[#4C5A56]">
            {block.subtitle}
          </p>
          <WhitelistForm variant="hero" trust={block.trust} />
          <WhatsAppInline />
        </div>

        <div className="min-w-[300px] max-w-[560px] flex-1 basis-[420px]">
          <HeroImage />
        </div>
      </div>
    </section>
  )
}

// Visual hero kanan = gambar venue lokal (next/image). LCP: priority + sizes + quality + blur LQIP.
// CMS-driven image = follow-up (Sanity image + urlFor + LQIP). Mockup CSS lama: ./hero-mockup.
function HeroImage() {
  return (
    <Image
      src={heroVenue}
      alt="A modern venue interior set and ready for guests — the kind of space Booqin helps you fill"
      priority
      quality={75}
      sizes="(max-width: 820px) 100vw, 560px"
      placeholder="blur"
      className="h-auto w-full rounded-[20px] border border-[rgba(20,33,31,0.08)] shadow-[0_30px_70px_-28px_rgba(14,77,71,0.42),0_10px_24px_-16px_rgba(14,77,71,0.25)]"
    />
  )
}
