import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteFooter } from '@/components/sections/site-footer'
import { SiteHeader } from '@/components/sections/site-header'
import { siteSettings } from '@/lib/content/site-settings'

// page.tsx & layout.tsx kini async Server Components (data-driven). Smoke render-nya dijamin
// oleh `pnpm build` (prerender statis). Di sini kita uji landmark dari komponen chrome (sync).
describe('Site chrome landmarks', () => {
  it('header exposes banner + navigation', () => {
    render(<SiteHeader nav={siteSettings.nav} />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('footer exposes contentinfo', () => {
    render(<SiteFooter footer={siteSettings.footer} />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
