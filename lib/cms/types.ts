import type { ChatMessage, Faq, IconCard, NavLink, Step, Testimonial } from '@/lib/content/landing'

/**
 * Bentuk data CMS (type manual). Saat Studio asli ada, ganti dengan hasil `sanity typegen`
 * dari `defineQuery` di lib/cms/queries.ts. Tiap blok = object pageBuilder dengan `_type` + `_key`.
 */

export type HeroBlock = {
  _type: 'hero'
  _key: string
  badge: string
  subtitle: string
  trust: string
}

export type ProblemBlock = {
  _type: 'problem'
  _key: string
  eyebrow: string
  heading: string
  intro: string
  cards: IconCard[]
}

export type AiSpotlightBlock = {
  _type: 'aiSpotlight'
  _key: string
  eyebrow: string
  heading: string
  intro: string
  chat: ChatMessage[]
  capabilities: IconCard[]
}

export type HowItWorksBlock = {
  _type: 'howItWorks'
  _key: string
  eyebrow: string
  heading: string
  steps: Step[]
}

export type FeaturesBlock = {
  _type: 'features'
  _key: string
  eyebrow: string
  heading: string
  items: IconCard[]
}

export type SocialProofBlock = {
  _type: 'socialProof'
  _key: string
  heading: string
  intro: string
  testimonials: Testimonial[]
  logos: string[]
}

export type FaqBlock = {
  _type: 'faq'
  _key: string
  eyebrow: string
  heading: string
  items: Faq[]
}

export type CtaBlock = {
  _type: 'cta'
  _key: string
  headingTop: string
  headingBottom: string
  body: string
  trust: string
}

export type PageBlock =
  | HeroBlock
  | ProblemBlock
  | AiSpotlightBlock
  | HowItWorksBlock
  | FeaturesBlock
  | SocialProofBlock
  | FaqBlock
  | CtaBlock

export type Seo = {
  title?: string
  description?: string
  noindex?: boolean
}

export type Page = {
  _id?: string
  title?: string
  slug?: string
  seo?: Seo
  pageBuilder: PageBlock[]
}

export type SiteSettings = {
  nav: { links: NavLink[]; cta: NavLink }
  footer: { tagline: string; links: NavLink[]; cta: NavLink; copyright: string }
}
