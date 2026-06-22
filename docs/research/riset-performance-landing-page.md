# Riset Performance Landing Page Perusahaan
### Core Web Vitals, Optimasi Aset, dan Caching dengan Next.js 16

*Dokumen riset internal · Disusun Juni 2026*

---

## Daftar Isi

0. [Ringkasan Eksekutif](#0-ringkasan-eksekutif)
1. [Konteks & Prinsip](#1-konteks--prinsip)
2. [Core Web Vitals (Diagnosis & Fix)](#2-core-web-vitals-diagnosis--fix)
3. [Image Optimization](#3-image-optimization)
4. [Font Optimization](#4-font-optimization)
5. [Caching Strategy (Full Stack)](#5-caching-strategy-full-stack)
6. [JavaScript & Bundle Optimization](#6-javascript--bundle-optimization)
7. [Measurement & Monitoring](#7-measurement--monitoring)
8. [Bagaimana Semuanya Terhubung](#8-bagaimana-semuanya-terhubung)
9. [Referensi](#9-referensi)

---

## 0. Ringkasan Eksekutif

Dokumen ini merangkum riset Performance untuk landing page perusahaan di Next.js 16 + headless CMS — kelanjutan dari riset Foundation dan Discoverability. Cakupannya enam pilar:

1. **Core Web Vitals** — diagnosis & fix spesifik per metrik (LCP, INP, CLS), dengan pengukuran sebagai langkah nol.
2. **Image optimization** — `next/image`/`next-sanity/image`: AVIF/WebP, `sizes`, blur LQIP, offload ke CDN Sanity.
3. **Font optimization** — `next/font`: self-host, subset, variable font, anti-CLS via `size-adjust`.
4. **Caching strategy** — lima lapisan caching utuh, header CDN, dan jebakan CDN-vs-revalidation.
5. **JavaScript & bundle** — tuas utama INP: server-first, dynamic import, `optimizePackageImports`, React Compiler.
6. **Measurement & monitoring** — lab vs field, RUM, Lighthouse CI, performance budget.

Tesis intinya: **performa adalah disiplin berkelanjutan, bukan refactor sekali jalan, dan ia dimulai dari pengukuran.** Keputusan static-first dari Foundation sudah jadi keunggulan LCP & INP; bab ini menambahkan optimasi aset, model caching penuh, dan pengukuran yang menjaga skor tidak luntur seiring fitur baru bertambah.

---

## 1. Konteks & Prinsip

Performa bukan obsesi teknis — ia metrik bisnis. Halaman lebih cepat menurunkan bounce, menaikkan konversi, dan jadi sinyal ranking. Dengan 60%+ traffic global dari mobile dan mobile-first indexing, **performa mobile-mu adalah sinyal rankingmu**.

Dua prinsip yang memandu seluruh dokumen:

- **Ukur dulu, baru optimasi.** Skor lab pada laptop cepat tidak memprediksi pengalaman pengguna mobile nyata. Bangun pengukuran dulu, optimasi apa yang datanya tunjukkan benar-benar lambat.
- **Performa adalah habit produk.** Fitur, skrip, dan konten baru akan menurunkan skor; tanpa gerbang otomatis & pemantauan, skor luntur seiring waktu.

Target Core Web Vitals 2026, di **P75** halaman penting: **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1**.

---

## 2. Core Web Vitals (Diagnosis & Fix)

### 2.1 Aturan #0: ukur dulu

Disiplin paling sering dilanggar. Skor Lighthouse 100 di incognito pada laptop cepat tidak memprediksi P75 LCP pengguna mobile 4G. Ada dua jenis data: **lab** (Lighthouse/PSI — untuk audit & debugging) dan **field/RUM** (CrUX/RUM — pengguna nyata, gold standard untuk ranking). Untuk situs baru tanpa data CrUX, pasang RUM sendiri dengan `useReportWebVitals` di leaf client kecil:

```tsx
// components/web-vitals.tsx
'use client'
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name, value: metric.value, rating: metric.rating,
      path: window.location.pathname,
    })
    navigator.sendBeacon('/api/vitals', body) // tak memblokir unload
  })
  return null
}
```

Mount di root layout sebagai leaf kecil agar layout tetap server-rendered. Praktik lanjutan: log per route group dan simpan build ID bersama metrik agar regresi pasca-deploy bisa dipetakan.

### 2.2 LCP — Largest Contentful Paint

**Diagnosis dulu, jangan asal kompres gambar.** Buka DevTools, jalankan performance trace, lihat apa elemen LCP sebenarnya — kalau itu teks atau komponen data, optimasi gambar adalah fix yang salah. Fix berdasarkan jenis:

- **TTFB dulu** — server lambat membuat semuanya jadi percuma; tak ada optimasi frontend yang mengkompensasi response 2 detik. Static-first + CDN dari Foundation = TTFB minimal.
- **Kalau LCP = gambar:** pakai `priority` (menambah `fetchpriority="high"` + preload, mematikan lazy-load).

```tsx
// Gambar hero (elemen LCP) — JANGAN lazy-load
<Image src={hero.image} alt={hero.alt} width={1200} height={600} priority />
```

- **Kalau LCP = teks/data:** render di server (RSC), jangan fetch above-the-fold di client.

### 2.3 INP — Interaction to Next Paint

INP berbeda dari FID lama: ia mengukur durasi penuh dari interaksi hingga frame berikutnya ter-paint (termasuk processing & rendering), bukan hanya delay awal — situs yang lolos FID bisa gagal INP. INP nyaris selalu soal **client JavaScript**.

Penyebab #1: `'use client'` level-halaman yang ditambahkan untuk satu elemen lalu tak ditinjau ulang — seluruh subtree dikirim sebagai client JS & ter-hydrate. Dorong boundary ke komponen terkecil (disiplin client island dari Foundation; satu tim melaporkan ini memangkas bundle ~35% & memperbaiki INP).

Untuk interaksi yang memicu pekerjaan berat, pakai `useTransition`:

```tsx
'use client'
import { useState, useTransition } from 'react'

export function ProductFilter({ items }: { items: Item[] }) {
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(items)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)                    // urgent: input responsif
    startTransition(() => {        // non-urgent: filtering di-defer
      setFiltered(items.filter((i) => i.name.includes(v)))
    })
  }
  return <input value={query} onChange={onChange} />
}
```

Kalau hanya ada waktu untuk satu review: audit setiap boundary `'use client'` dan penempatan skrip pihak ketiga — dua permukaan itu menyumbang porsi regresi terbesar.

### 2.4 CLS — Cumulative Layout Shift

Mekanis: set width/height gambar & video, hindari sisip konten dinamis, `font-display: swap`, reservasi ruang. Mayoritas sudah otomatis dari `next/image` (dimensi wajib) dan `next/font` (fallback metrics). Yang perlu perhatian: dynamic hole (Suspense) — reservasi tingginya:

```tsx
<div style={{ minHeight: 48 }}>
  <Suspense fallback={null}><LivePromoBanner /></Suspense>
</div>
```

### 2.5 Urutan perbaikan tercepat

Gain tercepat: kompres gambar hero → hapus skrip pihak ketiga berat → CDN + caching → kurangi bundle JS. Dua langkah pertama biasanya lompatan terbesar dengan usaha terkecil.

### 2.6 Hindari — Core Web Vitals

- ❌ Optimasi tanpa ukur.
- ❌ Percaya skor lab sebagai pengganti field P75.
- ❌ Lazy-load gambar LCP.
- ❌ `'use client'` level-halaman — biang INP buruk.
- ❌ Fetch data above-the-fold di client.
- ❌ Abaikan TTFB.
- ❌ Konten dinamis tanpa reservasi ruang.

---

## 3. Image Optimization

Gambar biasanya tuas terbesar untuk CWV. `next/image` adalah pipeline: konversi format (WebP/AVIF, 25–70% lebih kecil), responsive resizing, lazy loading, dan penanganan dimensi yang mencegah CLS.

### 3.1 Konfigurasi

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    formats: ['image/avif', 'image/webp'],  // AVIF dulu
    qualities: [60, 75, 90],                 // allowlist (Next 16)
    minimumCacheTTL: 60 * 60 * 24 * 30,      // 30 hari (default 60 detik terlalu pendek)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
}
export default nextConfig
```

Dua setting yang sering salah: `minimumCacheTTL` (default 60 detik terlalu pendek; set 30 hari) dan `remotePatterns` sebagai allowlist (jangan wildcard tak tepercaya).

### 3.2 Next.js 16: quality di-allowlist

Mulai Next.js 16, nilai `quality` dibatasi (mencegah abuse via URL params yang menghabiskan sumber daya server). Daftarkan nilai di `qualities` dan set `quality` eksplisit. Pedoman: above-fold kritis 90, umum 75, thumbnail 60.

### 3.3 `sizes` — non-negotiable

Kesalahan #1. Tanpa `sizes`, setiap gambar di-download pada lebar viewport (100vw). Beri tahu browser lebar render per breakpoint:

```tsx
<Image
  src={image} alt={alt} width={1200} height={600} quality={75}
  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
/>
```

`sizes` yang benar bisa menurunkan payload gambar lebih dari 60%.

### 3.4 priority, fill, placeholder

- **`priority`** — hanya untuk satu gambar LCP (hero); sisanya lazy.
- **`fill`** — saat kontainer mengontrol dimensi (aspect-ratio).
- **`placeholder="blur"`** — gambar besar above-the-fold; untuk remote, pakai blurDataURL.

### 3.5 Integrasi Sanity — dua pendekatan

**A — `next/image` + remotePatterns:** Next.js yang mengoptimasi (perlu `cdn.sanity.io`).

**B — `next-sanity/image` (rekomendasi):** loader bawaannya melewati proxy optimasi Next.js dan membangun URL langsung ke image CDN Sanity; Sanity CDN menangani resizing, konversi format (AVIF/WebP), dan caching di edge — tidak perlu remotePatterns, dan server Next.js tidak memproses gambar (beban CPU/memori turun). Otomatis menjaga aspect ratio antar breakpoint.

```tsx
import { SanityImage } from 'next-sanity/image'

export function CmsImage({ image, alt }: { image: SanityImageSource; alt: string }) {
  return <SanityImage src={image} alt={alt} sizes="(max-width: 768px) 90vw, 45vw" />
}
```

Untuk gambar dari CMS, **Pendekatan B lebih unggul** — mengurangi beban server & memanfaatkan edge CDN Sanity.

### 3.6 Blur placeholder dari LQIP Sanity

```ts
const IMAGE_FRAGMENT = `asset->{ "lqip": metadata.lqip, "dim": metadata.dimensions }`
```

```tsx
<Image
  src={urlFor(image).url()} alt={alt}
  width={image.dim.width} height={image.dim.height}
  placeholder="blur" blurDataURL={image.lqip} quality={75}
/>
```

### 3.7 Hindari — image

- ❌ Tanpa `sizes` — download 100vw raksasa.
- ❌ `priority` di banyak gambar.
- ❌ `<img>` mentah untuk gambar konten.
- ❌ `minimumCacheTTL` default 60 detik.
- ❌ `remotePatterns` wildcard tak tepercaya.
- ❌ Gambar tanpa dimensi (CLS).
- ❌ `<Image>` untuk SVG (impor langsung sebagai komponen).
- ❌ `alt` kosong.

---

## 4. Font Optimization

`next/font` mengoptimasi font otomatis, menghapus request eksternal (privasi + performa), dan self-host bawaan — termuat tanpa layout shift.

### 4.1 Mekanisme kunci: anti-CLS via size-adjust

`font-display: swap` (pencegah FOIT) sering jadi penyebab CLS — sekitar 18% situs Next.js dengan swap punya CLS buruk. Solusi `next/font`: otomatis menerapkan `size-adjust` (plus `ascent-override`, `descent-override`, `line-gap-override`) agar font fallback menempati ruang yang persis sama dengan font custom — manfaat swap tanpa biaya CLS, otomatis.

### 4.2 Setup (module-level)

```ts
// lib/fonts.ts
import { Inter, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'

export const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
export const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' })

export const brand = localFont({
  src: [
    { path: './fonts/Brand-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Brand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap', variable: '--font-brand',
})
```

```tsx
// app/layout.tsx
import { sans, mono, brand } from '@/lib/fonts'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${brand.variable}`}>
      <body className={sans.className}>{children}</body>
    </html>
  )
}
```

### 4.3 Variable font & subsetting

**Variable font** — satu file mencakup semua weight (kurangi total download). **Subsetting** ke `['latin']` mengecilkan file (WOFF2 subset latin biasanya < 100KB). Font self-hosted dari `/_next/static/media/` tanpa request ke googleapis/gstatic.

### 4.4 Strategi `display`

| `display` | Perilaku | Pakai untuk |
|---|---|---|
| **`swap`** (default) | Fallback dulu, swap saat ready | Mayoritas teks |
| **`optional`** | Skip custom kalau lambat | Font sekunder, perf-kritis |
| **`block`** | Tunggu sebentar lalu render | Jarang; branding ketat |

### 4.5 Integrasi Tailwind

```css
/* globals.css (Tailwind v4) */
@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-brand: var(--font-brand);
}
```

### 4.6 Hindari — font

- ❌ Memuat font via `<link>`/`@import` (tanpa preload/subset, FOIT, bocor privasi).
- ❌ Mendefinisikan font di dalam komponen (harus module-level).
- ❌ Memuat semua weight & subset.
- ❌ Menonaktifkan `adjustFontFallback` (kembalikan CLS).
- ❌ Terlalu banyak family/weight.
- ❌ Tidak pakai CSS variable.

---

## 5. Caching Strategy (Full Stack)

Next.js 16 punya empat lapisan caching server + Router Cache klien, masing-masing di level berbeda dengan invalidasi berbeda. Memperlakukannya sebagai hal yang sama menghasilkan halaman basi atau lambat.

### 5.1 Pergeseran: caching jadi opt-in

`fetch()` tidak lagi cache by default (Next 16: `no-store`, segar tiap request kecuali opt-in). Cache Components membuat caching opt-in lewat `'use cache'`. Manfaat operasionalnya: tiap komponen ber-cache punya owner, tag, dan trigger invalidasi yang jelas — nol insiden data basi.

### 5.2 Lapisan-lapisannya

| Lapisan | Yang di-cache | Lokasi | Invalidasi |
|---|---|---|---|
| **Request Memoization** | `fetch` identik dalam 1 render | Memori server (per-request) | Otomatis tiap request |
| **`'use cache'`** | Hasil fungsi/komponen ber-cache | Server cache persisten | `cacheLife` + `revalidateTag` |
| **Full Route Cache** | HTML + RSC prerendered | Server / build | Revalidasi route |
| **CDN edge cache** | Response per `Cache-Control` | CDN edge | TTL (`s-maxage`) / purge |
| **Client Router Cache** | RSC payload navigasi | Memori browser | `staleTimes` |

### 5.3 Header CDN otomatis

| Strategi route | `Cache-Control` |
|---|---|
| Statis | `s-maxage=31536000` (1 tahun) |
| ISR (time-based) | `s-maxage={revalidate}, stale-while-revalidate={expire-revalidate}` |
| Dinamis | `private, no-cache, no-store, max-age=0` |

### 5.4 Jebakan besar: CDN vs on-demand revalidation

Caching di level CDN saja **tidak** mendukung on-demand revalidation — `revalidateTag()` meng-invalidasi server cache Next.js, tapi CDN terus menyajikan versi cache-nya sampai TTL-nya habis. Implikasi untuk webhook Pola B (Foundation):

- **Di Vercel** — purge CDN terintegrasi otomatis; webhook jalan apa adanya.
- **Di CDN generik** — `revalidateTag` saja tidak cukup; purge CDN juga:

```ts
// app/api/revalidate/route.ts (versi sadar-CDN)
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  // ... verifikasi secret ...
  const { slug } = await req.json()
  revalidateTag(`page:${slug}`, 'max')              // 1) invalidasi server cache Next

  if (process.env.CDN_PURGE_URL) {                  // 2) purge CDN generik (jika ada)
    await fetch(process.env.CDN_PURGE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CDN_API_TOKEN}` },
      body: JSON.stringify({ files: [`https://yourcompany.com/${slug}`] }),
    })
  }
  return Response.json({ revalidated: true, slug })
}
```

### 5.5 cacheLife & Client Router Cache

```ts
'use cache'
cacheLife('max') // atau { stale, revalidate, expire } eksplisit
```

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: { staleTimes: { dynamic: 30, static: 180 } },
}
```

### 5.6 Kebijakan caching landing page

- **Hero/fitur/footer** → static shell, dari CDN.
- **Konten CMS** → `'use cache'` + `cacheLife('max')` + `cacheTag`, webhook (+ purge CDN jika perlu).
- **Banner live** → cache pendek → dynamic hole via Suspense.

### 5.7 Hindari — caching

- ❌ Menganggap lapisan saling tertukar.
- ❌ `revalidateTag` saja di belakang CDN generik.
- ❌ Mengira `fetch` masih cache by default.
- ❌ `s-maxage` panjang tanpa strategi invalidasi.
- ❌ Cache data personal di lapisan publik (kebocoran antar pengguna).
- ❌ Tag global.
- ❌ Lupa `cacheComponents: true`.

---

## 6. JavaScript & Bundle Optimization

Tuas paling langsung untuk INP. Setiap KB JS memakan ~1ms parse time di mobile; bundle 847KB pernah membuat app butuh 4,2 detik untuk interaktif. Penyebab umumnya dependensi (lodash penuh untuk satu fungsi, Moment untuk satu tanggal, icon set ribuan ikon, charting di homepage).

### 6.1 Ukur dulu: Bundle Analyzer

Next.js 16.1 punya Bundle Analyzer terintegrasi — memudahkan optimasi ukuran bundle, memperbaiki CWV, menurunkan cold start, mengungkap bloat. Jalankan sebelum menebak.

### 6.2 Lever 1 — Server-first

Cara paling ampuh: jangan kirim JS ke client. Jaga logika berat di server (RSC), `next/dynamic` untuk UI non-kritis, data fetching di server. Disiplin client island dari Foundation.

### 6.3 Lever 2 — Dynamic import

```tsx
import dynamic from 'next/dynamic'

const PricingCalculator = dynamic(() => import('@/components/pricing-calculator'), {
  loading: () => <CalculatorSkeleton />,
})
const VideoPlayer = dynamic(() => import('@/components/video-player'), { ssr: false })
```

### 6.4 Lever 3 & 4 — Config flags

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    reactCompiler: true,                              // auto-memoization
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash'], // tree-shake modul
  },
  serverExternalPackages: ['sharp'],                  // jaga paket server-only keluar dari client
}
```

`optimizePackageImports` hanya memuat modul yang dipakai (pengurangan 30–50% umum untuk UI library berat; eksperimental — tes dulu). React Compiler menambahkan memoization otomatis tanpa `useMemo`/`useCallback`.

### 6.5 Lever 5 — Higiene dependensi

| Berat | Ganti dengan |
|---|---|
| Moment.js (~66KB) | `date-fns` / `dayjs` / `Intl` |
| lodash penuh (~72KB) | import per-fungsi / native |
| axios | `fetch` native |
| `lodash.cloneDeep` | `structuredClone` |
| Barrel import | Import path spesifik |

Cek tiap dependensi baru di bundlephobia.com sebelum install. Prefer native API (`fetch`, `Intl`, `structuredClone`).

### 6.6 Budget & CI

Set budget (target < 200KB first-load JS), tegakkan di CI, audit per kuartal. Sambung ke gerbang CI Foundation: cek ukuran bundle yang menggagalkan build kalau melewati budget.

### 6.7 Hindari — bundle

- ❌ Optimasi tanpa Bundle Analyzer.
- ❌ `'use client'` level-halaman.
- ❌ Import seluruh library untuk satu fungsi.
- ❌ Barrel file import.
- ❌ Charting/editor berat di-import statis.
- ❌ Dependensi tanpa cek bundlephobia.
- ❌ Paket server-only bocor ke client.
- ❌ Tanpa performance budget di CI.

---

## 7. Measurement & Monitoring

Tanpa pengukuran, optimasi itu buta. Bab ini mengikat semua bab sebelumnya.

### 7.1 Lab vs field

**Lab** (Lighthouse, PSI lab, WebPageTest) — terkontrol, untuk dev & CI. **Field** (CrUX, RUM) — pengguna nyata; bagian field data di PSI itulah yang penting untuk SEO, bukan skor lab. PSI saja tidak cukup — kombinasikan WebPageTest (waterfall) + CrUX/RUM.

### 7.2 Tumpukan pengukuran

| Kebutuhan | Tool | Jenis |
|---|---|---|
| Audit cepat + field per-URL | PageSpeed Insights | Lab + Field |
| Status pass/fail seluruh situs | Search Console (CWV report) | Field |
| CrUX programatik | CrUX API + Looker Studio | Field |
| RUM granular per route/device | `useReportWebVitals` / Speed Insights | Field |
| Gerbang regresi otomatis | Lighthouse CI | Lab |
| Waterfall debugging | WebPageTest | Lab |
| Sumber bloat JS | Bundle Analyzer | Lab |

### 7.3 Field/RUM: setup

**Jalur A — RUM sendiri:** komponen `WebVitals` (#2.1) mengirim ke endpoint:

```ts
// app/api/vitals/route.ts
export async function POST(req: Request) {
  const metric = await req.json() // { name, value, rating, path }
  await storeMetric(metric)
  return new Response(null, { status: 204 })
}
```

**Jalur B — Vercel Speed Insights (jika di Vercel):**

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
// di <body>: {children}<SpeedInsights /><Analytics />
```

**Peringatan:** alat monitoring jangan merusak performa yang diukurnya. New Relic/Sentry menempelkan CWV tapi menyuntik skrip yang bersaing untuk sumber daya awal — Sentry pernah menambah 200ms blocking di mobile. `useReportWebVitals` (ringan & native) lebih aman.

### 7.4 Lab di CI: performance budget

```json
// lighthouserc.json
{
  "ci": {
    "collect": { "url": ["https://yourcompany.com/", "https://yourcompany.com/pricing"], "numberOfRuns": 3 },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 200 }]
      }
    }
  }
}
```

```yaml
# .github/workflows/ci.yml — tambahkan ke gerbang Foundation
- run: npm install -g @lhci/cli && lhci autorun
```

**Nuansa INP di CI:** INP berbasis interaksi nyata, **tidak bisa diukur penuh di lab**. Di Lighthouse/CI pakai **Total Blocking Time (TBT)** sebagai proksi; INP sebenarnya datang dari field/RUM.

### 7.5 Disiplin berkelanjutan

Baseline dulu (PSI + WebPageTest) sebelum mengubah apa pun. Tetapkan ritme review mingguan (Search Console CWV report) dan cek setelah tiap rilis besar. Pantau regresi per route, kaitkan ke konversi.

### 7.6 Hindari — measurement

- ❌ Hanya percaya skor lab Lighthouse.
- ❌ Tanpa baseline sebelum optimasi.
- ❌ Monitoring tool berat yang menambah blocking time.
- ❌ Mengira lab bisa mengukur INP (pakai TBT proksi).
- ❌ Tanpa gerbang performa di CI.
- ❌ Performa sebagai proyek sekali jalan.
- ❌ Mengukur global saja (regresi per-route tersembunyi).

---

## 8. Bagaimana Semuanya Terhubung

Performa bukan daftar trik terpisah — ia **loop berkelanjutan** yang berlabuh pada pengukuran. Tiap metrik punya penyebab spesifik dan lever spesifik dari bab tertentu:

```
1. Ukur baseline — lab (Lighthouse/PSI) + field/RUM (useReportWebVitals)
        ↓
2. Diagnosis per metrik: identifikasi elemen LCP, audit 'use client' & skrip pihak ketiga, cek bundle
        ↓
3. Fix LCP: TTFB via static + CDN, gambar hero priority, font self-host
        ↓
4. Fix INP: kurangi client JS (RSC/island), dynamic import, defer skrip pihak ketiga
        ↓
5. Fix CLS: dimensi gambar, size-adjust font, reservasi ruang konten dinamis
        ↓
6. Jaga: gerbang CI (Lighthouse budget) + RUM berkelanjutan → ulangi
```

Pemetaan metrik → lever:

| Metrik | Penyebab umum | Lever (bab) |
|---|---|---|
| **LCP** | TTFB lambat, gambar hero berat | Caching/static (#5), Image (#3), Font (#4) |
| **INP** | Client JS berlebih, skrip pihak ketiga | JS/Bundle (#6), client islands (Foundation) |
| **CLS** | Gambar tanpa dimensi, font swap, konten dinamis | Image (#3), Font (#4), Suspense reservasi (#2) |

Benang merahnya: keputusan static-first dari Foundation sudah memberi LCP & INP awal yang baik; optimasi aset (Image/Font) dan caching penuh memperkuatnya; bundle discipline menjaga INP; dan measurement + CI memastikan semuanya tidak luntur. Karena gerbang CI dan RUM berjalan terus, performa jadi properti yang dijaga, bukan diperbaiki sekali lalu dilupakan.

---

## 9. Referensi

Fakta versi, API, dan data diverifikasi terhadap dokumentasi resmi dan sumber industri (Juni 2026):

- Dokumentasi resmi Next.js — Image Optimization, Font Optimization, Caching (Cache Components), CDN Caching, `optimizePackageImports`, Bundle Analyzer (16.1), `useReportWebVitals`.
- Panduan performa & Core Web Vitals Next.js 2026 dari praktisi independen (DebugBear, Code With Seb, TheCodeForge, Stanza, DEV Community, pagespeedmatters, corewebvitals.io, Blazity, dan lainnya).
- Dokumentasi Sanity — `next-sanity/image`, LQIP & image metadata.
- Vercel Academy & Speed Insights — RUM setup, performance budgets.

*Detail data & versi dapat berubah; verifikasi ulang sebelum keputusan final.*
