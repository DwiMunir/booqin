// SANITY (Fase 2): global `siteSettings` (tagline, links, copyright) — BUKAN pageBuilder block.
import { Logo } from '@/components/ui/logo'
import type { SiteSettings } from '@/lib/cms/types'

export function SiteFooter({ footer }: { footer: SiteSettings['footer'] }) {
  return (
    <footer className="bg-brand-dark text-[#A9C6C0]">
      <div className="container-page flex flex-wrap items-center justify-between gap-7 py-12">
        <div className="max-w-[340px]">
          <a href="#hero" aria-label="Booqin home" className="mb-3 inline-flex">
            <Logo variant="footer" />
          </a>
          <p className="text-[0.92rem] text-[#8FB3AC]">{footer.tagline}</p>
        </div>
        <div className="flex items-center gap-7">
          {footer.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[0.92rem] font-semibold transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <a href={footer.cta.href} className="text-[0.92rem] font-bold text-amber-light">
            {footer.cta.label}
          </a>
        </div>
      </div>
      <div className="border-t border-white/[0.08]">
        <div className="container-page py-[18px] text-[0.82rem] text-[#8FB3AC]">
          {footer.copyright}
        </div>
      </div>
    </footer>
  )
}
