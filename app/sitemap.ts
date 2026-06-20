import type { MetadataRoute } from 'next'
import { getAllPageSlugs } from '@/lib/cms/get-page'
import { site } from '@/lib/seo/site'
import { toSitemap } from '@/lib/seo/sitemap'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return toSitemap(await getAllPageSlugs(), site.url)
}
