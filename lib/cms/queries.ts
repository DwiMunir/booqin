import { defineQuery } from 'next-sanity'

// defineQuery -> siap TypeGen saat schema Studio tersedia. Blok = object (tanpa expand reference).
export const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  seo{ title, description, noindex },
  pageBuilder[]{ ... }
}`)

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  nav{ links[]{ label, href }, cta{ label, href } },
  footer{ tagline, links[]{ label, href }, cta{ label, href }, copyright }
}`)

// Daftar slug halaman untuk sitemap.
export const SLUGS_QUERY = defineQuery(`*[_type == "page" && defined(slug.current)]{
  "slug": slug.current,
  "updatedAt": _updatedAt
}`)
