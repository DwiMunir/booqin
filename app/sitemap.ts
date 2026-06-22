import type { MetadataRoute } from 'next'
import { getAllPageSlugs } from '@/lib/cms/get-page'
import { site } from '@/lib/seo/site'
import { type PageRef, toSitemap } from '@/lib/seo/sitemap'

// Route statis non-CMS yang tetap harus masuk sitemap (mis. Privacy Policy).
const STATIC_ROUTES: PageRef[] = [{ slug: 'privacy' }]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cms = await getAllPageSlugs()
  const cmsSlugs = new Set(cms.map((p) => p.slug))
  const extra = STATIC_ROUTES.filter((r) => !cmsSlugs.has(r.slug))
  return toSitemap([...cms, ...extra], site.url)
}
