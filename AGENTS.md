# AGENTS.md — Konvensi Proyek Landing Page

> File ini memandu coding agent menulis kode yang konsisten dengan keputusan riset. Baca seluruhnya sebelum mengerjakan task apa pun. Aturan di sini bersifat **wajib**, bukan saran.

## Stack (jangan ubah versi tanpa alasan)

- **Next.js 16.2.x**, App Router, Turbopack (default)
- **Node.js ≥ 20.9** (runtime — bukan edge; Cache Components & `proxy.ts` butuh Node)
- **React 19.2** + React Compiler
- **TypeScript strict**, **Biome** (lint+format), **Vitest** (test)
- **Sanity** sebagai headless CMS (Studio di **repo terpisah**)
- **Resend** untuk form whitelist email
- **Self-hosted** (lihat bagian Deploy)
- `cacheComponents: true` di `next.config.ts`

## Arsitektur — non-negotiable

1. **Static-first.** Landing page di-prerender statis. JANGAN pakai `export const dynamic = 'force-dynamic'` di level halaman. SSR per-request hanya untuk bagian yang benar-benar personal.
2. **Server Components default.** `'use client'` hanya di leaf terkecil yang butuh interaktivitas (client island). JANGAN taruh `'use client'` di `layout.tsx` atau `page.tsx`.
3. **Konten dari CMS via Pola B:** fungsi `'use cache'` + `cacheLife('max')` + `cacheTag('page:<slug>')`, di-invalidasi webhook → `revalidateTag(tag, 'max')` (argumen kedua wajib).
4. **Block-renderer:** halaman = array blok dari Sanity, dipetakan ke komponen via registry. Blok tak dikenal di-skip (tidak crash).
5. **Query CMS hanya di `lib/cms/`**, bukan di dalam `components/`.

## Struktur folder

```
app/(marketing)/        layout (nav+footer), page.tsx, [...slug]/page.tsx
app/api/revalidate/     webhook Sanity
app/actions/            server actions (form)
app/layout.tsx          root: html/body, font, metadata global, JSON-LD, <WebVitals/>
app/sitemap.ts, app/robots.ts, app/not-found.tsx, app/error.tsx
components/ui/           primitif (Button, Input)
components/sections/     Hero, Features, Cta, WhitelistForm
components/block-renderer.tsx
lib/cms/                 client, queries (use cache), types
lib/env.ts               validasi env (zod), secret TANPA prefix NEXT_PUBLIC_
lib/fonts.ts, lib/seo/
```

## Rendering & caching

- Konten CMS: `'use cache'` + `cacheTag('page:<slug>')`. Tag spesifik per halaman — JANGAN tag global.
- Bagian live/personal (mis. banner): bungkus `<Suspense>` → dynamic hole, jangan bikin seluruh halaman dinamis.
- `fetch` di Next 16 default `no-store` — opt-in cache secara eksplisit.

## SEO (wajib ada)

- `metadataBase` di root metadata; `title.template`; `description` default.
- `viewport` & `themeColor` lewat **export `viewport` terpisah**, BUKAN di object `metadata`.
- `generateMetadata` per halaman dari CMS (query ber-cache yang sama), dengan **canonical per-halaman** & toggle `noindex` dari CMS.
- **Tepat satu `<h1>`** per halaman (hero); section lain `<h2>`. HTML semantik (`header/nav/main/section/footer`).
- JSON-LD `Organization` + `WebSite` (global, `@graph`, escape `<`), `FAQPage` hanya jika FAQ tampil.
- `sitemap.ts` & `robots.ts` dinamis dari CMS; `robots.ts` **environment-aware** (noindex non-produksi); `lastModified` dari `_updatedAt`.

## Performa (wajib)

- Gambar: `next-sanity/image` (offload ke CDN Sanity) atau `next/image`. SELALU `sizes` di gambar responsif. Hero (LCP) pakai `priority`. `quality` eksplisit (Next 16 allowlist). `blurDataURL` dari LQIP Sanity.
- Font: `next/font` di `lib/fonts.ts` (module-level), `subsets: ['latin']`, variable font, CSS variable. JANGAN `<link>`/`@import` Google Fonts.
- Bundle: server-first; `next/dynamic` untuk widget berat; `experimental.optimizePackageImports` untuk icon/util libs; `reactCompiler: true`. Hindari barrel import.
- RUM: komponen `<WebVitals/>` (`useReportWebVitals`) sebagai leaf `'use client'` kecil di root layout → kirim ke `/api/vitals`.

## Form whitelist → Resend

- Server Action di `app/actions/`, validasi **zod**, anti-spam **honeypot** + checkbox **consent** wajib.
- Tambah ke audience: `resend.contacts.create({ email, audienceId, unsubscribed: false })`.
- API key Resend hanya di server (`RESEND_API_KEY`, tanpa `NEXT_PUBLIC_`).
- Client form pakai `useActionState`; tampilkan state pending & sukses/gagal.

## Self-host (Deploy)

- `output: 'standalone'` di `next.config.ts` untuk image Docker ramping.
- Jalankan `next start` di Node (single instance = default filesystem cache, `revalidateTag` jalan).
- Jika scaling multi-instance nanti: butuh `cacheHandler` kustom (mis. Redis) untuk shared cache.
- Jika ada CDN generik (mis. Cloudflare) di depan: webhook revalidate harus **purge CDN juga** (revalidateTag saja tidak mem-purge CDN).

## DX & gerbang

- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, alias `@/*`, `typedRoutes: true`.
- Lint/format: Biome. Skrip: `lint`, `typecheck` (`tsc --noEmit`), `test` (vitest) — JANGAN `next lint` (sudah dihapus).
- Test kontrak `block-renderer` (render blok dikenal + skip blok tak dikenal). JANGAN unit-test async Server Component (pakai E2E).
- CI gate: `lint → typecheck → test → build` (`next build` tidak lagi nge-lint).

## NEVER (anti-pattern yang harus dihindari)

- ❌ `'use client'` di page/layout; fetch konten utama di `useEffect`.
- ❌ `force-dynamic` di landing page; cache tag global.
- ❌ Secret/API key di Client Component atau `NEXT_PUBLIC_`.
- ❌ Gambar tanpa `sizes`/dimensi; `priority` di banyak gambar; `<Image>` untuk SVG.
- ❌ Font via `<link>`/`@import`; mendefinisikan font di dalam komponen.
- ❌ Lebih dari satu `<h1>`; lupa canonical; JSON-LD tanpa escape `<`.
- ❌ `revalidateTag` saja di belakang CDN generik (purge CDN juga).
- ❌ Form tanpa validasi server / anti-spam / consent.
