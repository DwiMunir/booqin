// SANITY (Fase 2): pageBuilder block `socialProof`.
import Image from 'next/image'
import { Reveal } from '@/components/client/reveal'
import type { SocialProofBlock } from '@/lib/cms/types'
import proofBar from '../../public/proof-bar.jpg'
import proofHall from '../../public/proof-hall.jpg'
import proofStudio from '../../public/proof-studio.jpg'

const avatarBg: Record<'brand' | 'amber' | 'teal', string> = {
  brand: 'bg-brand text-white',
  amber: 'bg-amber text-[#1c1206]',
  teal: 'bg-teal text-white',
}

// Gambar venue lokal + alt-nya (CMS image = follow-up; alt menyatu dgn asetnya, bukan dari CMS).
const PHOTOS = [
  { src: proofHall, alt: 'An event hall set for a celebration' },
  { src: proofBar, alt: 'A bar venue set up for the evening' },
  { src: proofStudio, alt: 'A bright studio space, ready to book' },
]

export function SocialProof({ block }: { block: SocialProofBlock }) {
  return (
    <section id="proof" className="bg-cream">
      <div className="container-page py-[clamp(64px,8vw,104px)]">
        <Reveal className="mb-11 text-center">
          <h2 className="mb-2.5 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-[1.12] tracking-[-0.02em] text-balance text-[#11231F]">
            {block.heading}
          </h2>
          <p className="text-[1.05rem] text-[#5C6A66]">{block.intro}</p>
        </Reveal>

        <Reveal className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {PHOTOS.map(({ src, alt }) => (
            <Image
              key={alt}
              src={src}
              alt={alt}
              quality={75}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 370px"
              placeholder="blur"
              className="aspect-[16/10] h-auto w-full rounded-[14px] border border-[#E2DBCD] object-cover"
            />
          ))}
        </Reveal>

        <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {block.testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <div className="rounded-[18px] border border-[rgba(20,33,31,0.08)] bg-white p-[26px]">
                <p className="mb-[18px] text-[1.05rem] leading-[1.5] text-[#1F2E2B]">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-10 items-center justify-center rounded-full font-display font-extrabold ${avatarBg[t.avatar]}`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-[0.92rem] font-bold text-[#11231F]">{t.name}</div>
                    <div className="text-[0.82rem] text-[#7A857F]">{t.org}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="flex flex-wrap items-center justify-center gap-x-[30px] gap-y-3.5 opacity-90">
          {block.logos.map((logo) => (
            <span
              key={logo}
              className="rounded-lg border border-dashed border-[#CFC6B4] px-4 py-2 font-mono text-[12px] text-[#9A9282]"
            >
              {logo}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
