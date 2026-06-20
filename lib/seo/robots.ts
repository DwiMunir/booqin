import type { MetadataRoute } from 'next'

// Pure + testable. Non-produksi → noindex total; produksi → allow-all (termasuk crawler AI) + sitemap.
export function buildRobots(isProd: boolean, siteUrl: string): MetadataRoute.Robots {
  if (!isProd) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
