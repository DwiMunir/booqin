import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/sections/site-footer'
import { SiteHeader } from '@/components/sections/site-header'
import { getSiteSettings } from '@/lib/cms/get-page'

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <>
      <SiteHeader nav={settings.nav} />
      <main id="main">{children}</main>
      <SiteFooter footer={settings.footer} />
    </>
  )
}
