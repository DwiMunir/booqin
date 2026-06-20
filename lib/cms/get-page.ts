import { cacheLife, cacheTag } from 'next/cache'
import { isSanityConfigured, sanityClient } from '@/lib/cms/client'
import { PAGE_QUERY, SITE_SETTINGS_QUERY, SLUGS_QUERY } from '@/lib/cms/queries'
import type { Page, SiteSettings } from '@/lib/cms/types'
import { homePage } from '@/lib/content/home-page'
import { siteSettings as siteSettingsFallback } from '@/lib/content/site-settings'
import type { PageRef } from '@/lib/seo/sitemap'

const fallbackPage = (slug: string): Page => (slug === 'home' ? homePage : { pageBuilder: [] })

// Pola B: di-cache 'max', tag per-halaman; webhook publish -> revalidateTag('page:<slug>','max').
// Resilient: error fetch (creds/CORS/jaringan) di-log lalu fallback ke hardcode — halaman tak pernah blank.
export async function getCachedPage(slug: string): Promise<Page> {
  'use cache'
  cacheLife('max')
  cacheTag(`page:${slug}`)

  if (!isSanityConfigured() || !sanityClient) return fallbackPage(slug)
  try {
    const data = await sanityClient.fetch(PAGE_QUERY, { slug })
    return (data as Page | null) ?? fallbackPage(slug)
  } catch (err) {
    console.error(`[cms] getCachedPage('${slug}') gagal, pakai fallback:`, err)
    return fallbackPage(slug)
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  'use cache'
  cacheLife('max')
  cacheTag('siteSettings')

  if (!isSanityConfigured() || !sanityClient) return siteSettingsFallback
  try {
    const data = await sanityClient.fetch(SITE_SETTINGS_QUERY)
    return (data as SiteSettings | null) ?? siteSettingsFallback
  } catch (err) {
    console.error('[cms] getSiteSettings gagal, pakai fallback:', err)
    return siteSettingsFallback
  }
}

// Untuk sitemap. Cache 'max', tag 'pages'. Fallback ke home bila CMS belum siap/kosong.
export async function getAllPageSlugs(): Promise<PageRef[]> {
  'use cache'
  cacheLife('max')
  cacheTag('pages')

  const fallback: PageRef[] = [{ slug: 'home' }]
  if (!isSanityConfigured() || !sanityClient) return fallback
  try {
    const data = await sanityClient.fetch(SLUGS_QUERY)
    const list = (data as PageRef[] | null) ?? []
    const cleaned = list.filter((p) => Boolean(p?.slug))
    return cleaned.length > 0 ? cleaned : fallback
  } catch (err) {
    console.error('[cms] getAllPageSlugs gagal, pakai fallback:', err)
    return fallback
  }
}
