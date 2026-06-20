import type { Metadata } from 'next'
import { BlockRenderer } from '@/components/block-renderer'
import { getCachedPage } from '@/lib/cms/get-page'

// Metadata per-halaman dari CMS (seo block) + canonical + toggle noindex. Fallback ke default root.
export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedPage('home')
  return {
    title: page.seo?.title,
    description: page.seo?.description,
    alternates: { canonical: '/' },
    robots: page.seo?.noindex ? { index: false, follow: false } : undefined,
  }
}

// Halaman digerakkan block-renderer dari getCachedPage (fallback hardcode bila Sanity belum disetel).
export default async function HomePage() {
  const page = await getCachedPage('home')
  return <BlockRenderer blocks={page.pageBuilder} />
}
