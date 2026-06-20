import {
  aiSpotlight,
  cta,
  faq,
  features,
  hero,
  howItWorks,
  pageBuilder,
  problem,
  socialProof,
} from './blocks'
import { page, siteSettings } from './documents'
import { chatMessage, faqItem, iconCard, navLink, seo, step, testimonial } from './objects'

// Daftarkan di sanity.config.ts: schema: { types: schemaTypes }
export const schemaTypes = [
  // documents
  page,
  siteSettings,
  // page builder + blocks
  pageBuilder,
  hero,
  problem,
  aiSpotlight,
  howItWorks,
  features,
  socialProof,
  faq,
  cta,
  // reusable objects
  seo,
  navLink,
  iconCard,
  step,
  testimonial,
  faqItem,
  chatMessage,
]
