import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { WebVitals } from '@/components/client/web-vitals'
import { fontDisplay, fontSans } from '@/lib/fonts'
import { OrganizationWebSiteJsonLd } from '@/lib/seo/jsonld'
import { site } from '@/lib/seo/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: '%s · Booqin' },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
}

export const viewport: Viewport = {
  themeColor: '#0e4d47',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontSans.variable}`}>
      <body className="bg-cream text-ink-soft font-sans antialiased">
        {children}
        <OrganizationWebSiteJsonLd />
        <WebVitals />
      </body>
    </html>
  )
}
