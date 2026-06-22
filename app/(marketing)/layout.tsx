import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/sections/site-footer'
import { SiteHeader } from '@/components/sections/site-header'
import { getSiteSettings } from '@/lib/cms/get-page'

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <>
      {/* Skip link — elemen fokus pertama; tampil saat di-Tab (keyboard a11y). */}
      <a
        href="#main"
        className="sr-only rounded-lg bg-brand px-4 py-2 font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>
      <SiteHeader nav={settings.nav} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter footer={settings.footer} />
    </>
  )
}
