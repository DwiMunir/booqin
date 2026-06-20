// SANITY (Fase 2): global `siteSettings` (logo, nav links, CTA) — BUKAN pageBuilder block.
import { MobileNav } from '@/components/client/mobile-nav'
import { CtaAnchor } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import type { SiteSettings } from '@/lib/cms/types'

export function SiteHeader({ nav }: { nav: SiteSettings['nav'] }) {
  return (
    <header className="sticky top-0 z-[60] border-b border-[rgba(20,33,31,0.07)] bg-[rgba(250,247,241,0.82)] backdrop-blur-[12px] backdrop-saturate-[1.6]">
      <nav className="container-page flex items-center justify-between gap-4 py-3.5">
        <a href="#hero" aria-label="Booqin home">
          <Logo />
        </a>

        <div className="hidden items-center gap-[30px] min-[820px]:flex">
          {nav.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.95rem] font-semibold text-[#3C4A47] transition-colors hover:text-brand"
            >
              {l.label}
            </a>
          ))}
          <CtaAnchor href={nav.cta.href}>{nav.cta.label}</CtaAnchor>
        </div>

        <div className="min-[820px]:hidden">
          <MobileNav links={nav.links} cta={nav.cta} />
        </div>
      </nav>
    </header>
  )
}
