# Booqin Fase 4 — SEO & Performa Polish — Design Spec

> Disetujui 2026-06-20. OG image = **branded statis**. WebVitals = MVP (log server-side).

## Deliverable
| File | Isi |
|---|---|
| `app/opengraph-image.tsx` | Kartu OG 1200×630 via `next/og` `ImageResponse`: latar cream→teal, brand mark (div) + wordmark "Booqin" + tagline. Font default ImageResponse (tanpa fetch runtime). Next auto-wire ke metadata OG+Twitter. |
| `lib/seo/robots.ts` | `buildRobots(isProd, url)` (pure) → non-prod `disallow:'/'`; prod allow-all + sitemap + host. Crawler AI diizinkan. |
| `lib/seo/sitemap.ts` | `toSitemap(pages, url)` (pure) → slug `home`→`/`, lain→`/<slug>`, `lastModified` dari `_updatedAt`, priority home=1. |
| `app/robots.ts` | `buildRobots(env.APP_ENV==='production', site.url)`. |
| `app/sitemap.ts` | `toSitemap(await getAllPageSlugs(), site.url)`. |
| `lib/cms/queries.ts` | + `SLUGS_QUERY` (`*[_type=="page" && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`). |
| `lib/cms/get-page.ts` | + `getAllPageSlugs()`: `'use cache'` + `cacheTag('pages')`, fallback `[{slug:'home'}]`, try/catch resilient. |
| `components/client/web-vitals.tsx` | `'use client'` `useReportWebVitals` → `navigator.sendBeacon('/api/vitals', json)`. |
| `app/api/vitals/route.ts` | POST → `console.log` metric → 204. |
| `app/layout.tsx` | pasang `<WebVitals/>` (leaf kecil). |

## Pemisahan unit (testable)
Logika map robots/sitemap = **fungsi pure** di `lib/seo/` (di-unit-test). Fetch ber-cache (`getAllPageSlugs`) diverifikasi lewat build (tak bisa di-unit-test karena `cacheLife/cacheTag` butuh runtime Next).

## Testing
- `lib/seo/robots.test.ts`: prod → allow + sitemap; non-prod → disallow.
- `lib/seo/sitemap.test.ts`: home→base url + priority 1; slug lain→`/<slug>`; lastModified dari updatedAt.
- OG image: diverifikasi via build + curl `/opengraph-image` → `image/png`.

## Catatan
- OG statis branded (per-halaman dinamis = follow-up).
- Webhook sebaiknya nanti juga revalidate tag `pages` saat page dibuat/dihapus (sitemap fresh) — peningkatan kecil, dicatat.
- WebVitals MVP log-only; kirim ke analytics eksternal = follow-up.
- Lighthouse: dijalankan best-effort ke build produksi (target LCP<2.5s, CLS<0.1); manual bila Chrome tak tersedia di sandbox.

## Gate
`pnpm typecheck && lint && test && build` lulus; OG endpoint `image/png`; (Lighthouse best-effort).
