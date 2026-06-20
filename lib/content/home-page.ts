import type { Page } from '@/lib/cms/types'
import {
  aiSpotlight,
  faq,
  features,
  finalCta,
  hero,
  howItWorks,
  problem,
  socialProof,
} from '@/lib/content/landing'

/**
 * Halaman home hardcode (mode credential-ready) — dibangun dari konten Fase 1.
 * Bentuknya = hasil PAGE_QUERY: { ..., pageBuilder: PageBlock[] }. `_key` stabil (bukan index runtime).
 */
export const homePage: Page = {
  title: 'Booqin — The AI booking assistant for venue owners',
  slug: 'home',
  pageBuilder: [
    { _type: 'hero', _key: 'hero', badge: hero.badge, subtitle: hero.subtitle, trust: hero.trust },
    {
      _type: 'problem',
      _key: 'problem',
      eyebrow: problem.eyebrow,
      heading: problem.heading,
      intro: problem.intro,
      cards: problem.cards,
    },
    {
      _type: 'aiSpotlight',
      _key: 'aiSpotlight',
      eyebrow: aiSpotlight.eyebrow,
      heading: aiSpotlight.heading,
      intro: aiSpotlight.intro,
      chat: aiSpotlight.chat,
      capabilities: aiSpotlight.capabilities,
    },
    {
      _type: 'howItWorks',
      _key: 'howItWorks',
      eyebrow: howItWorks.eyebrow,
      heading: howItWorks.heading,
      steps: howItWorks.steps,
    },
    {
      _type: 'features',
      _key: 'features',
      eyebrow: features.eyebrow,
      heading: features.heading,
      items: features.items,
    },
    {
      _type: 'socialProof',
      _key: 'socialProof',
      heading: socialProof.heading,
      intro: socialProof.intro,
      testimonials: socialProof.testimonials,
      logos: [...socialProof.logos],
    },
    {
      _type: 'faq',
      _key: 'faq',
      eyebrow: faq.eyebrow,
      heading: faq.heading,
      items: faq.items,
    },
    {
      _type: 'cta',
      _key: 'cta',
      headingTop: finalCta.headingTop,
      headingBottom: finalCta.headingBottom,
      body: finalCta.body,
      trust: finalCta.trust,
    },
  ],
}
