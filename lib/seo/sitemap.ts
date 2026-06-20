import type { MetadataRoute } from 'next'

export type PageRef = { slug: string; updatedAt?: string }

// Pure + testable. Slug 'home' -> root '/'; lainnya -> '/<slug>'. lastModified dari _updatedAt CMS.
export function toSitemap(pages: PageRef[], siteUrl: string): MetadataRoute.Sitemap {
  return pages.map((p) => ({
    url: p.slug === 'home' ? siteUrl : `${siteUrl}/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: p.slug === 'home' ? 1 : 0.7,
  }))
}
