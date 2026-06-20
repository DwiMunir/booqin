import type { Metadata } from 'next'
import { BlockRenderer } from '@/components/block-renderer'
import { getCachedPage } from '@/lib/cms/get-page'
import { site } from '@/lib/seo/site'

// Metadata per-halaman dari CMS (seo block) + canonical + toggle noindex.
// PENTING: tanpa title CMS, JANGAN kirim `title` (biar title.default root dipakai) — mengirim
// `undefined` justru menimpa default sehingga <title>/<meta description> hilang.
export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedPage('home')
  return {
    ...(page.seo?.title ? { title: page.seo.title } : {}),
    description: page.seo?.description ?? site.description,
    alternates: { canonical: '/' },
    robots: page.seo?.noindex ? { index: false, follow: false } : undefined,
  }
}

// Halaman digerakkan block-renderer dari getCachedPage (fallback hardcode bila Sanity belum disetel).
export default async function HomePage() {
  const page = await getCachedPage('home')
  return <BlockRenderer blocks={page.pageBuilder} />
}
