import type { Metadata } from 'next'
import { BlockRenderer } from '@/components/block-renderer'
import { getCachedPage } from '@/lib/cms/get-page'
import { site } from '@/lib/seo/site'

// Metadata per-halaman dari CMS (seo block) + canonical + toggle noindex.
// Home pakai title ABSOLUT (tanpa template `· Booqin`): judulnya sudah memuat brand, jadi
// template root akan menggandakan "Booqin" + melewati 60 char. Selalu kirim string (jangan
// undefined) agar <title>/<meta description> default tak ketimpa.
export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedPage('home')
  return {
    title: { absolute: page.seo?.title ?? site.title },
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
