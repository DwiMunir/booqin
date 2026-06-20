import type { SiteSettings } from '@/lib/cms/types'
import { footer, nav } from '@/lib/content/landing'

// Fallback SiteSettings (mode credential-ready). Fase 2-live: ganti dari siteSettings singleton Sanity.
export const siteSettings: SiteSettings = {
  nav: { links: [...nav.links], cta: nav.cta },
  footer: {
    tagline: footer.tagline,
    links: [...footer.links],
    cta: footer.cta,
    copyright: footer.copyright,
  },
}
