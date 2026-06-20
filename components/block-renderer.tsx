import { AiSpotlight } from '@/components/sections/ai-spotlight'
import { Faq } from '@/components/sections/faq'
import { Features } from '@/components/sections/features'
import { FinalCta } from '@/components/sections/final-cta'
import { Hero } from '@/components/sections/hero'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Problem } from '@/components/sections/problem'
import { SocialProof } from '@/components/sections/social-proof'
import type { PageBlock } from '@/lib/cms/types'

/**
 * Registry blok: map `_type` -> komponen section. Key pakai `_key` (bukan index).
 * Blok dengan `_type` tak dikenal di-SKIP (return null) — tidak crash.
 */
export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block._type) {
          case 'hero':
            return <Hero key={block._key} block={block} />
          case 'problem':
            return <Problem key={block._key} block={block} />
          case 'aiSpotlight':
            return <AiSpotlight key={block._key} block={block} />
          case 'howItWorks':
            return <HowItWorks key={block._key} block={block} />
          case 'features':
            return <Features key={block._key} block={block} />
          case 'socialProof':
            return <SocialProof key={block._key} block={block} />
          case 'faq':
            return <Faq key={block._key} block={block} />
          case 'cta':
            return <FinalCta key={block._key} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}
