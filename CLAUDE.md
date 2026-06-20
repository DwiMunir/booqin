# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini. Baca seluruhnya sebelum mengerjakan task. Aturan di sini **wajib**.

## Project

Landing page perusahaan, greenfield, **self-hosted**. Dibangun dari riset arsitektur (Foundation, Discoverability, Performance). Konten dari **Sanity** (Studio di repo terpisah). Form whitelist email tersambung ke **Resend**.

## Commands

```bash
pnpm dev              # dev server (Turbopack)
pnpm build            # production build — HARUS lulus sebelum pindah fase
pnpm start            # next start (Node runtime)
pnpm lint             # Biome
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest (run sekali)
pnpm test:watch       # Vitest watch
```

> Catatan: `next lint` sudah dihapus di Next 16 dan `next build` tidak menjalankan linter. Jalankan `pnpm lint` & `pnpm typecheck` secara eksplisit.

## Workflow (cara kerja yang diharapkan)

1. **Kerjakan per fase** sesuai `BUILD_PLAN.md`. Selesaikan & verifikasi satu fase sebelum lanjut.
2. **Setelah tiap perubahan berarti**, jalankan `pnpm typecheck` lalu `pnpm build`. Jangan anggap selesai sebelum keduanya lulus.
3. **Client island sekecil mungkin** — kalau menambah `'use client'`, pasang di leaf, bukan di page/layout.
4. **Jangan commit secret.** Semua key lewat env. Jangan pernah menaruh key di Client Component atau prefix `NEXT_PUBLIC_` untuk data rahasia.
5. **Konfirmasi dulu** sebelum operasi destruktif (hapus file massal, ubah skema DB, rewrite besar).
6. Tulis perubahan minimal yang menyelesaikan task; jangan refactor di luar scope tanpa diminta.

## Tech stack

- Next.js 16.2.x · App Router · Turbopack · `output: 'standalone'`
- Node.js ≥ 20.9 (Node runtime — bukan edge)
- React 19.2 + React Compiler
- TypeScript strict · Biome · Vitest
- Sanity (CMS) · Resend (email) · Tailwind v4
- `cacheComponents: true`

## Arsitektur — non-negotiable

1. **Static-first.** Halaman di-prerender statis. JANGAN `export const dynamic = 'force-dynamic'` di page.
2. **Server Components default.** `'use client'` hanya di leaf interaktif.
3. **Pola B (CMS):** `'use cache'` + `cacheLife('max')` + `cacheTag('page:<slug>')`, di-invalidasi webhook → `revalidateTag(tag, 'max')` (argumen kedua wajib).
4. **Block-renderer:** halaman = array blok dari Sanity → registry komponen; blok tak dikenal di-skip (tidak crash).
5. **Query CMS hanya di `lib/cms/`**, bukan di `components/`.

## Struktur folder

```
app/(marketing)/        layout (nav+footer), page.tsx, [...slug]/page.tsx
app/api/revalidate/     webhook Sanity
app/api/vitals/         penerima RUM
app/actions/            server actions (form)
app/layout.tsx          root: html/body, font, metadata global, JSON-LD, <WebVitals/>
app/sitemap.ts · app/robots.ts · app/not-found.tsx · app/error.tsx
components/ui/           primitif
components/sections/     Hero, Features, Cta, WhitelistForm
components/block-renderer.tsx
lib/cms/ · lib/env.ts · lib/fonts.ts · lib/seo/
```

## Konvensi

### Rendering & caching
- Tag cache spesifik per halaman (`page:<slug>`), JANGAN tag global.
- Bagian live/personal → `<Suspense>` (dynamic hole), bukan bikin halaman dinamis.
- `fetch` default `no-store` di Next 16; opt-in cache eksplisit.

### SEO
- `metadataBase` + `title.template` di root. `viewport`/`themeColor` via export `viewport` terpisah (BUKAN object `metadata`).
- `generateMetadata` per halaman dari CMS + **canonical per-halaman** + toggle `noindex`.
- **Tepat satu `<h1>`** per halaman; HTML semantik (`header/nav/main/section/footer`).
- JSON-LD `Organization` + `WebSite` (`@graph`, escape `<`). `FAQPage` hanya jika FAQ tampil.
- `sitemap.ts` & `robots.ts` dinamis; `robots.ts` env-aware (noindex non-produksi); izinkan crawler AI answer.

### Performa
- Gambar: `next-sanity/image` (offload ke CDN Sanity). SELALU `sizes`; hero (LCP) `priority`; `quality` eksplisit; `blurDataURL` dari LQIP.
- Font: `next/font` di `lib/fonts.ts` (module-level, subset latin, variable, CSS var). JANGAN `<link>`/`@import`.
- Bundle: server-first; `next/dynamic` untuk widget berat; `optimizePackageImports` + `reactCompiler`; hindari barrel import.
- RUM: `<WebVitals/>` (`useReportWebVitals`) leaf kecil → `/api/vitals`.

### Form whitelist → Resend
- Server Action di `app/actions/`, validasi **zod**, anti-spam **honeypot** + **consent** wajib.
- `resend.contacts.create({ email, audienceId, unsubscribed: false })`.
- `RESEND_API_KEY` hanya di server. Client form pakai `useActionState` (state pending/sukses/gagal).

### Self-host
- `next start` di Node. Single instance = default filesystem cache (`revalidateTag` jalan).
- Multi-instance nanti → `cacheHandler` kustom (Redis).
- CDN generik di depan → webhook harus purge CDN juga (revalidateTag tidak mem-purge CDN).

## Environment variables

```
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_TOKEN=          # server-only
CMS_WEBHOOK_SECRET=        # server-only
RESEND_API_KEY=            # server-only
RESEND_AUDIENCE_ID=
APP_ENV=production         # untuk robots.ts env-aware
NEXT_PUBLIC_SITE_URL=
```

Validasi semua via `lib/env.ts` (zod, fail-fast saat build).

## NEVER

- ❌ `'use client'` di page/layout; fetch konten utama di `useEffect`.
- ❌ `force-dynamic` di landing page; cache tag global.
- ❌ Secret/API key di client atau `NEXT_PUBLIC_`.
- ❌ Gambar tanpa `sizes`/dimensi; `priority` di banyak gambar; `<Image>` untuk SVG.
- ❌ Font via `<link>`/`@import`; font didefinisikan di dalam komponen.
- ❌ Lebih dari satu `<h1>`; lupa canonical; JSON-LD tanpa escape `<`.
- ❌ `revalidateTag` saja di belakang CDN generik (purge CDN juga).
- ❌ Form tanpa validasi server / anti-spam / consent.
- ❌ Commit secret atau file `.env`.
