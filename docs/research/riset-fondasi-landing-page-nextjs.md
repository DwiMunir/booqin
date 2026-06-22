# Riset Fondasi Landing Page Perusahaan
### Membangun greenfield dengan Next.js 16 + Headless CMS

*Dokumen riset internal · Disusun Juni 2026*

---

## Daftar Isi

0. [Ringkasan Eksekutif](#0-ringkasan-eksekutif)
1. [Konteks & Baseline Teknologi](#1-konteks--baseline-teknologi)
2. [Strategi Rendering](#2-strategi-rendering)
3. [Struktur Proyek Greenfield](#3-struktur-proyek-greenfield)
4. [Developer Experience & Testing](#4-developer-experience--testing)
5. [Pemilihan Headless CMS](#5-pemilihan-headless-cms)
6. [Content Modeling (Page Builder)](#6-content-modeling-page-builder)
7. [Bagaimana Semuanya Terhubung](#7-bagaimana-semuanya-terhubung)
8. [Referensi](#8-referensi)

---

## 0. Ringkasan Eksekutif

Dokumen ini merangkum keputusan arsitektur untuk membangun landing page perusahaan dari nol menggunakan Next.js 16 dan headless CMS. Tiga keputusan fondasi yang dibahas:

1. **Rendering** — Landing page perusahaan adalah konten yang jarang berubah, jadi defaultnya **static-first**, bukan SSR. Konten dari CMS disajikan statis tetapi selalu segar lewat *on-demand revalidation* (cache tag + webhook), bukan rebuild manual atau polling.

2. **Struktur & DX** — Struktur proyek menjaga batas Server/Client tetap jelas, memetakan konten CMS ke komponen lewat *block-renderer*, dan menjadikan type-check, lint, dan test sebagai gerbang otomatis di CI.

3. **Headless CMS** — Untuk startup greenfield Next.js, **Sanity** adalah default terkuat (schema-as-code, type-safety ke block-renderer, free tier produktif, cache tag granular). **Storyblok** jika otonomi visual marketing dominan; **Payload** jika ingin CMS di dalam codebase tanpa SaaS.

Benang merahnya: ketiga keputusan saling mengunci. Pilihan CMS harus mendukung cache tag granular agar strategi rendering jalan; struktur proyek harus memisahkan query CMS dari komponen agar caching terpusat; dan disiplin DX menjaga semua invariant ini tidak bocor seiring tim membesar.

---

## 1. Konteks & Baseline Teknologi

Proyek ini dibangun **greenfield** (tanpa migrasi legacy), sehingga kita bebas memilih arsitektur paling ideal sejak awal.

**Baseline per Juni 2026:**

| Komponen | Versi/Status |
|---|---|
| Next.js | 16.2.x stable (App Router standar) |
| Bundler | Turbopack (default) |
| Node.js | ≥ 20.9.0 (Node 18 di-drop) |
| React | 19.2 + React Compiler (stable) |
| Model caching | Eksplisit via **Cache Components** |
| Request interception | `proxy.ts` (menggantikan `middleware.ts`) |

Perubahan paling berpengaruh dari versi lama: **model caching jadi eksplisit**. Di Next.js 16, semuanya di-*prerender* secara default — kita justru *opt-in* ke dinamis hanya di tempat yang perlu. Ini ideal untuk landing page, karena mayoritas halaman memang statis.

Aktifkan Cache Components di konfigurasi:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true, // mengaktifkan direktif 'use cache'
  typedRoutes: true,     // type-safety untuk <Link>
}

export default nextConfig
```

---

## 2. Strategi Rendering

### 2.1 Model mental

Next.js 16 mem-prerender semua route secara default menjadi static HTML + RSC payload sebelum ada request. Artinya kita tidak perlu "mengaktifkan" statis — kita *opt-in ke dinamis*. Kesalahan paling umum adalah refleks memakai SSR (`force-dynamic`) yang justru memperlambat TTFB dan mematikan cache CDN.

Ada empat pola. Berikut pemetaannya ke bagian landing page nyata.

### 2.2 Pola A — Statis murni

Bagian hardcode/jarang berubah (hero, fitur, footer). Server Component biasa otomatis jadi shell statis selama tidak menyentuh API dinamis (`cookies()`, `headers()`, `searchParams`).

```tsx
// app/(marketing)/page.tsx
import { Hero } from '@/components/sections/hero'
import { Features } from '@/components/sections/features'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
    </>
  )
}
```

### 2.3 Pola B — Konten CMS + revalidate on-demand (pola utama)

Ini jantung arsitektur. Marketing mengedit di CMS → halaman tetap statis & cepat → langsung segar saat publish, **tanpa redeploy**. Caranya: bungkus fetch CMS dalam fungsi `'use cache'`, beri `cacheTag`, lalu invalidasi tag itu lewat webhook.

```ts
// lib/cms/queries.ts
import { cacheLife, cacheTag } from 'next/cache'

export async function getLandingContent(slug: string) {
  'use cache'
  cacheLife('max')            // cache panjang, andalkan revalidasi on-demand
  cacheTag(`page:${slug}`)    // tag spesifik halaman ini

  const res = await fetch(`https://your-cms.api/pages/${slug}`, {
    headers: { Authorization: `Bearer ${process.env.CMS_TOKEN}` },
  })
  if (!res.ok) throw new Error('CMS fetch failed')
  return res.json()
}
```

Webhook dari CMS memicu route ini saat editor publish:

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 1. Verifikasi secret — WAJIB, jangan biarkan endpoint ini terbuka
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.CMS_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // 2. Ambil slug dari payload CMS
  const body = await req.json()
  const slug = body?.slug ?? 'home'

  // 3. Invalidasi hanya tag yang relevan (bukan seluruh situs)
  revalidateTag(`page:${slug}`, 'max')

  return NextResponse.json({ revalidated: true, slug })
}
```

Dua detail krusial:

- **Argumen kedua `'max'` sekarang wajib.** Bentuk satu-argumen sudah deprecated. `'max'` memberi semantik *stale-while-revalidate* — konten lama disajikan langsung sementara konten baru di-fetch di background. Pengunjung tidak pernah melihat loading.
- **Tag harus spesifik** (`page:home`, bukan satu tag global). Granularitas tag = granularitas invalidasi.

### 2.4 `revalidateTag` vs `updateTag`

| Fungsi | Perilaku | Untuk |
|---|---|---|
| `revalidateTag(tag, 'max')` | Background, boleh stale sebentar | **Webhook CMS** (eventual consistency oke) |
| `updateTag(tag)` | Sinkron, read-your-writes | **Server Action** (user lihat perubahan langsung) |

Untuk landing page, webhook CMS pakai `revalidateTag`. `updateTag` baru relevan di form submission.

### 2.5 Pola C — Dynamic hole via Suspense

Jika ada bagian kecil yang harus dinamis (banner countdown, geo-greeting), bungkus dalam `<Suspense>` — ia jadi "lubang dinamis" yang di-stream, sisanya tetap shell statis instan.

```tsx
import { Suspense } from 'react'

export default function LandingPage() {
  return (
    <>
      <Hero /> {/* statis, instan */}
      <Suspense fallback={<PromoSkeleton />}>
        <LivePromoBanner /> {/* dinamis, di-stream */}
      </Suspense>
    </>
  )
}
```

```tsx
// components/sections/live-promo.tsx
import { cacheLife, cacheTag } from 'next/cache'

export async function LivePromoBanner() {
  'use cache'
  cacheLife({ stale: 30, revalidate: 60, expire: 300 }) // short-lived
  cacheTag('promo:active')
  const promo = await fetch('https://your-cms.api/promo/active').then(r => r.json())
  return promo ? <div className="promo-banner">{promo.message}</div> : null
}
```

Cache dengan lifetime sangat pendek (`expire` < 5 menit) otomatis dikeluarkan dari prerender dan menjadi dynamic hole — tanpa konfigurasi tambahan.

### 2.6 Preview/draft mode

Editor butuh melihat draft sebelum publish. Draft Mode mem-bypass cache:

```ts
// app/api/preview/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.CMS_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }
  const draft = await draftMode() // async di Next 16 — wajib di-await
  draft.enable()
  redirect(req.nextUrl.searchParams.get('slug') ?? '/')
}
```

> **Catatan:** `draftMode()`, `cookies()`, `headers()`, dan `params` semuanya **async** di Next 16. Lupa `await` adalah breaking change yang sering terlewat.

### 2.7 Hindari — rendering

- ❌ `export const dynamic = 'force-dynamic'` di landing page — memaksa SSR per-request, mematikan cache CDN.
- ❌ Fetch konten above-the-fold di Client Component (`useEffect` + `fetch`) — buruk untuk SEO & layout shift.
- ❌ `cookies()`/`headers()` di scope luas — meracuni subtree jadi dinamis.
- ❌ Satu cache tag global — satu edit meng-invalidasi seluruh situs.
- ❌ Webhook revalidate tanpa verifikasi secret — DoS murah.
- ❌ Time-based revalidate pendek demi "biar fresh" — boros origin; andalkan webhook.

### 2.8 Tabel keputusan

| Bagian | Pola | Alasan |
|---|---|---|
| Hero, fitur, footer | Statis murni | Tercepat, dari CDN |
| Konten CMS | `'use cache'` + `cacheTag` + webhook | Statis tapi selalu segar |
| Banner live | `<Suspense>` + cache short-lived | Dynamic hole |
| Personalisasi/geo | Suspense + dynamic API | Hanya bagian itu per-request |
| Form submission | Server Action + `updateTag` | Read-your-writes |

---

## 3. Struktur Proyek Greenfield

### 3.1 Struktur folder

```
.
├── app/
│   ├── (marketing)/              # route group: tidak memengaruhi URL
│   │   ├── layout.tsx            # shell marketing (navbar + footer)
│   │   ├── page.tsx              # homepage  →  /
│   │   ├── pricing/page.tsx      # →  /pricing
│   │   └── [...slug]/page.tsx    # catch-all halaman dari CMS
│   ├── api/
│   │   ├── revalidate/route.ts
│   │   └── preview/route.ts
│   ├── layout.tsx                # ROOT: <html>, <body>, font, metadata
│   ├── globals.css
│   ├── not-found.tsx
│   ├── error.tsx
│   └── global-error.tsx
├── components/
│   ├── ui/                       # primitif: Button, Input
│   ├── sections/                 # Hero, Features, CTA
│   └── block-renderer.tsx        # map blok CMS → komponen
├── lib/
│   ├── cms/                      # client, queries, types
│   ├── env.ts                    # validasi env var
│   └── utils.ts
├── proxy.ts
└── next.config.ts
```

Dua keputusan struktural penting:

- **Route group `(marketing)`** — tanda kurung membuat folder tidak muncul di URL. Memungkinkan satu layout untuk semua halaman marketing, dan mudah menambah group lain (`(auth)`, `(app)`) dengan shell berbeda tanpa nyampur.
- **`components/` tiga lapis** — `ui/` (primitif bisu), `sections/` (potongan bermakna marketing), `block-renderer.tsx` (jembatan ke CMS).

### 3.2 Root layout & font

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // hindari teks invisible (FOIT)
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yourcompany.com'),
  title: { default: 'Your Company', template: '%s · Your Company' },
  description: 'Default description.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

`next/font` mengoptimasi & self-host font otomatis (tidak ada request runtime ke Google), dan `display: 'swap'` langsung berdampak ke Core Web Vitals.

### 3.3 Validasi env var

Jangan akses `process.env` mentah di mana-mana. Validasi sekali, fail-fast saat build:

```ts
// lib/env.ts
import { z } from 'zod'

const schema = z.object({
  CMS_TOKEN: z.string().min(1),
  CMS_WEBHOOK_SECRET: z.string().min(1),
  CMS_PREVIEW_SECRET: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
})

export const env = schema.parse(process.env)
```

**Aturan keamanan:** hanya var berprefix `NEXT_PUBLIC_` yang boleh sampai ke browser. Token CMS dan webhook secret **tidak boleh** punya prefix itu, dan hanya dipakai di server.

### 3.4 Batas Server/Client

Default semua Server Component. `'use client'` hanya di leaf yang butuh interaktivitas — **dorong sejauh mungkin ke bawah pohon** (client island kecil).

```tsx
// components/sections/hero.tsx  → Server Component (default)
import { CtaButton } from './cta-button'

export function Hero({ title }: { title: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <CtaButton label="Get started" /> {/* island kecil */}
    </section>
  )
}
```

```tsx
// components/sections/cta-button.tsx
'use client' // hanya bagian interaktif yang jadi client
import { useState } from 'react'

export function CtaButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  return <button onClick={() => setOpen(true)}>{label}</button>
}
```

**Aturan:** Server Component boleh impor & render Client Component, tetapi Client Component tidak bisa impor Server Component. Jika butuh konten server di dalam client, oper sebagai `children`/prop.

### 3.5 Alur data

Fetch di Server Component (`async`), oper hasil sebagai props. Hindari fetch di `useEffect` untuk konten utama. Untuk fetch independen, jalankan paralel agar tidak terjadi waterfall:

```tsx
const [page, settings] = await Promise.all([
  getLandingContent('home'),
  getSiteSettings(),
])
```

### 3.6 Block renderer (pola kunci)

Jembatan CMS ↔ komponen. CMS mengirim array "blocks", renderer memetakannya ke komponen section:

```tsx
// components/block-renderer.tsx
import { Hero } from './sections/hero'
import { Features } from './sections/features'
import { Cta } from './sections/cta'
import type { Block } from '@/lib/cms/types'

const registry = {
  hero: Hero,
  features: Features,
  cta: Cta,
} as const

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) => {
        const Component = registry[block._type as keyof typeof registry]
        if (!Component) return null // graceful: blok tak dikenal dilewati
        return <Component key={block._key} {...block} />
      })}
    </>
  )
}
```

Kekuatannya: marketing bisa drag-drop urutan section, tambah/hapus blok, tanpa menyentuh kode — selama tipe bloknya ada di `registry`. Inilah yang membuat kombinasi "Headless CMS + Next.js" benar-benar powerful.

### 3.7 Special files wajib

| File | Fungsi |
|---|---|
| `loading.tsx` | UI loading saat Suspense aktif (streaming) |
| `error.tsx` | Error boundary per-segment (**harus** `'use client'`) |
| `not-found.tsx` | 404 yang rapi |
| `global-error.tsx` | Menangkap error di root layout |

### 3.8 Hindari — struktur

- ❌ `'use client'` di `app/layout.tsx`/page tanpa alasan — meracuni seluruh subtree.
- ❌ Barrel file (`index.ts` re-export) untuk komponen — mengaburkan batas client/server, memperburuk tree-shaking.
- ❌ Logika fetch di `components/` — query CMS tinggal di `lib/cms/`.
- ❌ Secret di Client Component — ke-bundle ke browser.
- ❌ Folder `utils/` raksasa — pecah per domain.

---

## 4. Developer Experience & Testing

Tujuan: membuat fondasi yang **menolak dirinya sendiri saat rusak**. Type-check, lint, dan test menjadi gerbang otomatis.

Perubahan kunci Next 16: `next lint` dihapus, dan `next build` tidak lagi menjalankan linter otomatis. Linting harus dijalankan eksplisit di CI.

### 4.1 TypeScript

```jsonc
// tsconfig.json (bagian penting)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true, // arr[i] jadi T | undefined
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

`noUncheckedIndexedAccess` memaksa penanganan kasus blok yang tidak ada di registry (lihat block-renderer). `typedRoutes: true` menangkap `<Link href="/typo">` yang invalid saat kompilasi.

### 4.2 Lint & format: Biome vs ESLint

Lanskap 2026: Biome adalah formatter + linter all-in-one terbaik saat proyek bisa hidup dalam rule set bawaannya; ESLint tetap paling aman saat plugin framework atau type-aware rules penting.

**Rekomendasi untuk landing page startup: Biome sebagai tool utama** (satu binary, cepat), dan opsional ESLint hanya dengan `@next/eslint-plugin-next` untuk aturan framework-spesifik.

```jsonc
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.4.15/schema.json",
  "formatter": { "enabled": true, "indentStyle": "space", "lineWidth": 100 },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true, "suspicious": { "noExplicitAny": "error" } }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "asNeeded" } }
}
```

```jsonc
// package.json — skrip memanggil linter LANGSUNG, bukan via next lint
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "check": "biome check --write .",
    "lint": "biome lint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

### 4.3 Strategi testing

**Jebakan terbesar:** Vitest belum mendukung async Server Components. Konsekuensinya:

- **Unit test (Vitest + RTL):** komponen UI sinkron, fungsi murni, dan **logika block-renderer**.
- **E2E (di luar scope fondasi):** halaman async (fetch CMS), preview mode, webhook.

Setup:

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event vite-tsconfig-paths
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./vitest.setup.ts'] },
})
```

Test struktur paling berharga — memastikan kontrak block-renderer:

```tsx
// components/block-renderer.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockRenderer } from './block-renderer'

describe('BlockRenderer', () => {
  it('merender blok yang dikenal', () => {
    render(<BlockRenderer blocks={[{ _type: 'hero', _key: '1', title: 'Halo' }]} />)
    expect(screen.getByText('Halo')).toBeInTheDocument()
  })

  it('mengabaikan blok tak dikenal tanpa crash', () => {
    const { container } = render(<BlockRenderer blocks={[{ _type: 'unknown', _key: '2' }]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

Test ini menjaga invariant: marketing menambah tipe blok baru yang belum ada komponennya → situs **tidak crash**.

### 4.4 CI sebagai gerbang fondasi

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint        # Biome
      - run: pnpm typecheck   # tsc --noEmit
      - run: pnpm test        # Vitest
      - run: pnpm build       # validasi prerender & 'use cache'
```

`pnpm build` di CI bukan formalitas — ia memvalidasi batas statis/dinamis benar-benar bisa di-prerender.

### 4.5 Pre-commit hook

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    format:
      glob: '*.{ts,tsx,js,jsx,json}'
      run: biome check --write {staged_files}
      stage_fixed: true
    typecheck:
      run: pnpm typecheck
```

Sertakan juga `AGENTS.md` saat scaffold agar coding agent menulis pola Next 16 yang benar (bukan caching gaya versi lama).

### 4.6 Hindari — DX/testing

- ❌ Mengandalkan `next build` untuk lint — sudah tidak berlaku.
- ❌ Unit-test async Server Component dengan Vitest — belum didukung.
- ❌ Skip `tsc --noEmit` di CI.
- ❌ Test styling detail alih-alih kontrak.
- ❌ Membiarkan `any` lewat — mematikan type-safety end-to-end.

---

## 5. Pemilihan Headless CMS

### 5.1 Kerangka keputusan: 6 sumbu

1. **Siapa editor utama?** Developer vs marketing non-teknis (paling menentukan).
2. **Schema di mana?** Repo (version-controlled) vs UI cloud.
3. **Model harga.** Per-seat vs usage vs self-host.
4. **Integrasi Next.js.** RSC, draft mode, dan **cache tag granular** untuk Pola B.
5. **Visual editing.** Otonomi marketing menyusun halaman.
6. **Self-host vs cloud.** Kepemilikan data & biaya operasional.

> **Penting:** Cache Components mengubah kalkulus Next.js. CMS yang mengekspos cache tag granular (Sanity, Payload, Contentful) berpasangan baik dengan Pola B; platform tanpa invalidasi tag memaksa full revalidation.

### 5.2 Kandidat & posisinya

Dua disingkirkan untuk startup greenfield:

- **Contentful — coret.** Harga mulai $300/bulan setelah menghapus free tier, plus ketidakpastian akuisisi Salesforce (Juni 2026).
- **Strapi — opsional.** Solid tapi framework-neutral + TCO self-host.

Tiga finalis:

| Sumbu | Sanity | Storyblok | Payload |
|---|---|---|---|
| Editor utama | Dev-first (visual editing ada) | **Marketer-first** | Dev-first |
| Schema | **Di repo (code)** | Di UI cloud | **Di repo (TS, dalam app)** |
| Query | GROQ + GraphQL | REST/GraphQL | REST/Local API |
| Type-safety | **GROQ + TypeGen** | generate-ts | **TS-native** |
| Visual editing | Tier-1 (Presentation) | **Terbaik di kelasnya** | Live preview |
| Cache tag granular | ✅ | ⚠️ terbatas | ✅ |
| Harga | per-seat, free tier produktif | Starter free, ~$99/mo Growth | **Free self-host** / Cloud $35/mo |
| Self-host | ❌ | ❌ | ✅ |

**Ringkas tiap platform:**

- **Sanity** — schema-as-code di version control, GROQ + TypeGen menghasilkan data layer App Router terbersih, free tier production-viable, kolaborasi real-time. Editor dapat UI form + overlay visual editing. Default banyak praktisi untuk Next.js baru.
- **Storyblok** — visual editor terbaik di kelasnya (moat-nya). Arsitektur "block" memetakan bersih ke block-renderer. Tapi schema di cloud (bukan repo), dan harga naik cepat saat skala.
- **Payload** — Next.js-native, berjalan di dalam app sebagai satu deployable, TS end-to-end, MIT/free self-host, cache tag granular. Trade-off: admin kurang poles, editor butuh onboarding lebih.

### 5.3 Pertanyaan pivotal & rekomendasi

Keputusan bergantung pada: **seberapa besar otonomi visual yang marketing butuhkan?**

- Marketing harus menyusun halaman penuh tanpa developer → **Storyblok**.
- Developer yang build, marketing edit berkala, ingin schema di repo + DX terbaik + free tier → **Sanity**.
- Ingin CMS di codebase sendiri tanpa SaaS, TS end-to-end → **Payload**.

**Rekomendasi default untuk kasus ini: Sanity.** Alasannya menyatu dengan arsitektur — schema-as-code sejalan dengan disiplin DX, GROQ+TypeGen memberi tipe otomatis ke block-renderer, free tier cocok untuk startup, dan cache tag granular membuat Pola B mulus. Pindah ke Storyblok bila otonomi visual marketing adalah requirement bisnis utama.

### 5.4 Integrasi konkret (jalur Sanity)

Schema-as-code di repo:

```ts
// sanity/schemas/page.ts
import { defineField, defineType } from 'sanity'

export const page = defineType({
  name: 'page',
  type: 'document',
  fields: [
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'blocks',
      type: 'array',
      of: [{ type: 'hero' }, { type: 'features' }, { type: 'cta' }],
    }),
  ],
})
```

Query GROQ dengan `'use cache'` + `cacheTag` (persis Pola B):

```ts
// lib/cms/queries.ts
import { cacheLife, cacheTag } from 'next/cache'
import { defineQuery } from 'next-sanity'
import { sanityClient } from './client'
import type { PageQueryResult } from '@/sanity.types' // hasil TypeGen

const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  "blocks": blocks[]{ _type, _key, ... }
}`)

export async function getCachedPage(slug: string): Promise<PageQueryResult> {
  'use cache'
  cacheLife('max')
  cacheTag(`page:${slug}`)
  return sanityClient.fetch(PAGE_QUERY, { slug })
}
```

Type-safety end-to-end:

```bash
npx sanity typegen generate   # schema + query → sanity.types.ts
```

Lalu webhook Sanity memicu route revalidate → `revalidateTag('page:home', 'max')`. Lingkaran tertutup: publish → webhook → tag stale → halaman segar.

> **Jika pilih Payload:** modelnya beda — Payload tinggal *di dalam* app Next.js (`app/(payload)/...`), query lewat Local API (tanpa HTTP round-trip). Block-renderer tetap sama, sumber data in-process.

### 5.5 Hindari — pemilihan CMS

- ❌ CMS tanpa cache tag granular + Pola B → paksa full revalidate.
- ❌ Memodelkan halaman sebagai satu blob rich-text raksasa.
- ❌ Token CMS di client / `NEXT_PUBLIC_`.
- ❌ Kunci ke schema in-UI tanpa rencana migrasi.
- ❌ Contentful untuk startup baru "karena namanya besar".
- ❌ Bayar premium Storyblok kalau marketing jarang edit.

---

## 6. Content Modeling (Page Builder)

Bab ini menentukan apakah kombinasi block-renderer + Sanity benar-benar fleksibel buat marketing, atau malah kaku dan rapuh saat redesign. Intinya satu keputusan filosofis, lalu serangkaian pola konkret.

### 6.1 Prinsip inti: model makna, bukan presentasi

Aturan tunggal paling penting: **page builder memodelkan konten, bukan presentasi.** Tujuan structured content adalah membuat konten tetap tangguh, adaptif, dan mudah diintegrasikan — karena itu model harus mencerminkan *makna* konten, bukan cara ia ditampilkan.

Praktiknya, di schema **jangan ada** warna, layout kolom, spacing, atau float — itu urusan kode. Yang ada hanyalah makna: "hero dengan judul, subjudul, dan ajakan bertindak", bukan "blok biru dua kolom dengan tombol merah".

Kenapa krusial: jika presentasi tertanam di konten, redesign berikutnya memaksa migrasi seluruh data. Jika konten murni makna, cukup ubah kode rendering.

### 6.2 Page builder = array blok yang bisa disusun

Bayangkan page builder sebagai tumpukan LEGO — tiap blok adalah potongan konten, mengalir dari atas ke bawah. Sanity tidak punya blok bawaan; kita membuatnya sendiri. Keputusan pertama tiap blok: **object atau reference?**

| Pendekatan | Kelebihan | Kekurangan | Pakai untuk |
|---|---|---|---|
| **Object** | Mudah di-query (inline) | "Terjebak" di dokumen, tak bisa dipakai ulang | Komposisi spesifik halaman (hero, susunan fitur) |
| **Reference** | Bisa dipakai ulang antar halaman | Query harus me-resolve | Konten berulang (FAQ, testimonial, logo, CTA banner) |

Aturan praktis: gunakan **object** untuk komposisi halaman, **reference** untuk konten yang dipakai di banyak tempat. Contoh: satu dokumen FAQ di-reference dari beberapa halaman — update sekali, berubah di semua tempat.

### 6.3 Anatomi sebuah blok

Dokumen `page` berisi array `pageBuilder`:

```ts
// sanity/schemas/documents/page.ts
import { defineField, defineType } from 'sanity'

export const page = defineType({
  name: 'page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Page sections',
      type: 'array',
      of: [
        { type: 'heroBlock' },
        { type: 'featuresBlock' },
        { type: 'testimonialsBlock' },
        { type: 'ctaBlock' },
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
})
```

Sebuah blok object — semua field adalah *makna*, dan CTA dimodelkan sebagai label + tujuan, bukan styling:

```ts
// sanity/schemas/blocks/hero-block.ts
import { defineField, defineType } from 'sanity'

export const heroBlock = defineType({
  name: 'heroBlock',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', description: 'Teks kecil di atas judul' }),
    defineField({
      name: 'heading',
      type: 'string',
      validation: (r) => r.required().max(80), // guardrail editor
    }),
    defineField({ name: 'subheading', type: 'text', rows: 3 }),
    defineField({
      name: 'cta',
      type: 'object',
      fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'href', type: 'string' }),
      ],
    }),
    // Escape hatch TERKONTROL: pilihan semantik, bukan CSS bebas
    defineField({
      name: 'layout',
      type: 'string',
      initialValue: 'default',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'Centered', value: 'centered' },
          { title: 'Split with image', value: 'split' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title ?? 'Hero', subtitle: 'Hero block' }),
  },
})
```

Dua hal penting:

- **`preview`** membuat blok dikenali editor di array (bukan "Object" generik) — detail kecil, dampak besar ke UX editorial.
- **`validation`** (max length, required) adalah *guardrail* — mencegah heading 300 karakter yang merusak layout. Ini kontrak antara model dan kode.

### 6.4 Variant: satu-satunya cara presentasi boleh masuk

Saat marketing butuh pilihan tampilan, caranya bukan field CSS bebas, melainkan **enum semantik terbatas** seperti field `layout` di atas (`default` | `centered` | `split`). Kode yang menerjemahkan `split` jadi layout dua kolom. Editor tak bisa membuat kombinasi yang merusak desain.

### 6.5 Portable Text untuk rich text

Untuk teks panjang/kaya format, **jangan** simpan HTML string. Pakai Portable Text — standar terpublikasi yang menyimpan block content sebagai array objek JSON, presentation-agnostic, dan bisa di-query dengan GROQ.

```ts
// sanity/schemas/objects/rich-text.ts
import { defineType, defineArrayMember } from 'sanity'

export const richText = defineType({
  name: 'richText',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        annotations: [
          { name: 'link', type: 'object', fields: [{ name: 'href', type: 'url' }] },
        ],
      },
    }),
    defineArrayMember({ type: 'image', options: { hotspot: true } }),
  ],
})
```

Render ke React via `@portabletext/react` (ikut `next-sanity`):

```tsx
// components/portable-text.tsx
import { PortableText, type PortableTextComponents } from '@portabletext/react'

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="text-2xl font-bold">{children}</h2>,
    blockquote: ({ children }) => <blockquote className="border-l-4 pl-4">{children}</blockquote>,
  },
  marks: {
    link: ({ value, children }) => <a href={value?.href}>{children}</a>,
  },
}

export function RichText({ value }: { value: unknown }) {
  return <PortableText value={value as never} components={components} />
}
```

Penataan visual (`text-2xl`, `border-l-4`) ada di **kode rendering**, bukan konten. Editor cukup memilih "Heading"/"Quote" (maknanya); kode memutuskan tampilannya.

### 6.6 Reusability lewat reference

```ts
// sanity/schemas/documents/testimonial.ts  → dokumen mandiri, dipakai ulang
export const testimonial = defineType({
  name: 'testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'quote', type: 'text', validation: (r) => r.required() }),
    defineField({ name: 'author', type: 'string' }),
    defineField({ name: 'role', type: 'string' }),
  ],
})

// sanity/schemas/blocks/testimonials-block.ts  → blok yang me-reference
export const testimonialsBlock = defineType({
  name: 'testimonialsBlock',
  title: 'Testimonials',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'items',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'testimonial' }] }],
    }),
  ],
})
```

Satu testimonial kini bisa dipakai di landing page, pricing, dan about — update sekali, berubah di semua.

### 6.7 Singleton untuk konten global

Nav, footer, dan site settings bukan "halaman" — model sebagai **singleton** (dokumen tunggal), bukan blok. Dirender di `layout.tsx` route group `(marketing)`, di-fetch sekali dengan tag sendiri (`cacheTag('settings')`).

### 6.8 Menghubungkan ke block-renderer & GROQ

Saat fetch, GROQ me-resolve reference dan mengembalikan `_type` + `_key` yang dipakai block-renderer:

```ts
const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  pageBuilder[]{
    _type,
    _key,
    ...,
    _type == "testimonialsBlock" => {
      items[]->{ quote, author, role }  // resolve reference jadi data utuh
    }
  }
}`)
```

`_type` → kunci di `registry` block-renderer. `_key` → React key. Lingkaran tertutup: schema makna → GROQ resolve → block-renderer map → komponen render dengan presentasi.

### 6.9 Hindari — content modeling

- ❌ **Menanam presentasi di konten** (warna, lebar kolom, margin, "raw HTML/CSS field") — mengunci konten ke satu desain.
- ❌ **Satu blob rich-text/HTML raksasa** untuk seluruh halaman.
- ❌ **Blok terlalu granular** (tiap tombol/gambar jadi blok) — editor kewalahan; blok = section bermakna.
- ❌ **Duplikasi konten** yang seharusnya reference.
- ❌ **Nama field deskriptif-tampilan** (`bigRedText`, `leftColumn`) alih-alih makna (`heading`, `eyebrow`).
- ❌ **Tanpa validasi/preview** — editor bikin blok kosong & tak bisa membedakan blok di array.
- ❌ **Variant sebagai CSS bebas** alih-alih enum semantik terbatas.

---

## 7. Bagaimana Semuanya Terhubung

Tiga keputusan fondasi bukan silo — mereka membentuk satu alur tunggal. Berikut perjalanan satu edit konten dari marketing sampai ke pengunjung:

```
1. Marketing edit di Sanity Studio, lalu publish
        ↓
2. Sanity mengirim webhook → POST /api/revalidate
        ↓
3. Route memverifikasi secret, lalu revalidateTag('page:home', 'max')
        ↓
4. Tag 'page:home' ditandai stale (stale-while-revalidate)
        ↓
5. Pengunjung berikutnya menerima shell statis dari CDN secara instan;
   konten segar di-fetch di background lewat getCachedPage()
        ↓
6. GROQ query mengembalikan array blocks (tipe dari TypeGen)
        ↓
7. BlockRenderer memetakan tiap blok ke komponen section di registry
        ↓
8. Halaman ter-render: cepat (statis), segar (revalidated), type-safe (TypeGen)
```

Setiap keputusan menopang yang lain:

- **Rendering (Pola B)** butuh CMS dengan **cache tag granular** → mengarahkan pemilihan CMS.
- **Block-renderer (struktur)** butuh konten termodel sebagai **array blok** → mengarahkan content modeling di CMS.
- **Type-safety (DX)** butuh CMS dengan **schema-as-code + TypeGen** → memperkuat pilihan Sanity.
- **Disiplin CI (DX)** menjaga semua invariant di atas tidak bocor seiring waktu.

Inilah alasan ketiga keputusan harus diambil bersama, bukan terpisah.

---

## 8. Referensi

Fakta versi dan API diverifikasi terhadap dokumentasi resmi Next.js dan sumber industri (Juni 2026):

- Dokumentasi resmi Next.js — Caching, Revalidating, `use cache`, `cacheTag`, `cacheLife`, `revalidateTag`, Vitest testing, Upgrading v16, Installation.
- Next.js blog — rilis 16, 16.2, dan 15.5 (penghapusan `next lint`, typed routes).
- Perbandingan headless CMS 2026 dari berbagai praktisi independen (FocusReactive, Techsy, Pooya Golchian, Lucky Media, Digital Applied, DEV Community).
- Pengumuman akuisisi Contentful oleh Salesforce (Juni 2026) dan perubahan harga Storyblok (April 2026).

*Detail harga dan versi dapat berubah; verifikasi ulang sebelum keputusan final.*
