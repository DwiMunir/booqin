# Riset Discoverability Landing Page Perusahaan
### SEO, Structured Data, dan AI Search dengan Next.js 16

*Dokumen riset internal · Disusun Juni 2026*

---

## Daftar Isi

0. [Ringkasan Eksekutif](#0-ringkasan-eksekutif)
1. [Konteks: Dua Wajah Pencarian](#1-konteks-dua-wajah-pencarian)
2. [Metadata Foundation](#2-metadata-foundation)
3. [Structured Data (JSON-LD)](#3-structured-data-json-ld)
4. [Sitemap & Robots](#4-sitemap--robots)
5. [SEO Friendly (On-Page & Teknis)](#5-seo-friendly-on-page--teknis)
6. [GEO / AI Search](#6-geo--ai-search)
7. [Bagaimana Semuanya Terhubung](#7-bagaimana-semuanya-terhubung)
8. [Referensi](#8-referensi)

---

## 0. Ringkasan Eksekutif

Dokumen ini merangkum riset Discoverability untuk landing page perusahaan yang dibangun di Next.js 16 + headless CMS — kelanjutan dari riset Foundation. Cakupannya lima pilar:

1. **Metadata** — basis teknis: title/description, Open Graph, canonical, robots, ditarik dinamis dari CMS lewat `generateMetadata`.
2. **Structured Data (JSON-LD)** — Schema.org untuk rich results *dan* pemahaman entitas oleh AI.
3. **Sitemap & Robots** — peta URL dinamis dari CMS dan kontrol akses crawler (termasuk crawler AI).
4. **SEO friendly** — rendering statis sebagai keunggulan, HTML semantik, internal linking, Core Web Vitals.
5. **GEO / AI search** — agar dikutip oleh ChatGPT, Perplexity, Google AI Overviews, Gemini, dan Claude.

Tesis intinya: **fondasi teknis yang sama menopang pencarian klasik dan AI search.** Rendering statis (dari riset Foundation) sudah jadi keunggulan SEO; metadata, JSON-LD, dan HTML semantik yang dibutuhkan SEO juga persis yang dipakai mesin AI untuk memahami & mengutip konten. GEO bukan disiplin terpisah, melainkan lapisan aditif — extractability, freshness, dan authority — di atas SEO yang kuat.

---

## 1. Konteks: Dua Wajah Pencarian

Discoverability di 2026 punya dua wajah: pencarian klasik (Google/Bing dengan blue links & rich results) dan AI search (jawaban langsung yang mengutip sumber). Mesin AI search kini menangani sekitar 12–18% query informasional berbahasa Inggris, naik tajam dari di bawah 2% setahun sebelumnya.

Kabar baik untuk kita: keduanya berbagi fondasi teknis yang sama. Karena landing page dibangun greenfield di Next.js 16 dengan rendering static-first (riset Foundation), konten sudah terkirim sebagai HTML penuh ke crawler tanpa perlu eksekusi JavaScript — titik awal yang kuat untuk keduanya.

Bab ini fokus ke kartu **Discoverability** saja. Ada overlap dengan kartu **Performance** (Core Web Vitals memengaruhi ranking) yang disinggung seperlunya, tapi optimasi performa mendalam adalah domainnya sendiri.

---

## 2. Metadata Foundation

Metadata adalah basis teknis Discoverability — sebelum structured data atau AI search, tag dasar harus benar dulu. Di Next.js ini *first-class*, hirarkis, dan bisa ditarik langsung dari CMS.

### 2.1 Model mental: hirarkis & dua mode

Metadata mengalir dari `layout.tsx` root ke bawah; segment anak meng-override atau memperkaya induknya. Dua mode: **statis** (`export const metadata`) untuk nilai tetap, dan **dinamis** (`generateMetadata`) untuk nilai dari CMS/route params. Metadata dinamis harus menarik dari CMS, bukan string hardcoded.

### 2.2 Root metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://yourcompany.com'), // resolve URL relatif (OG, canonical)
  title: {
    default: 'Your Company — Tagline singkat',
    template: '%s · Your Company', // halaman anak: "Pricing · Your Company"
  },
  description: 'Deskripsi default perusahaan, 150–160 karakter, jelas & spesifik.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Your Company',
    locale: 'en_US',
    url: '/',
    images: [{ url: '/og/default.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', site: '@yourcompany' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}
```

`max-image-preview: large` dan `max-snippet: -1` memberi izin preview gambar besar & snippet penuh di SERP.

### 2.3 Viewport — export terpisah (jebakan)

Di Next.js 16, `viewport` dan `themeColor` harus pakai export `viewport` tersendiri, bukan field metadata yang sudah deprecated. Keduanya hanya didukung di Server Component dan tidak boleh di-export bersama `generateViewport` dari segment yang sama.

```tsx
// app/layout.tsx
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}
```

### 2.4 Metadata dinamis dari CMS

`generateMetadata` menarik dari Sanity lewat query ber-cache yang **sama** dengan render halaman (`getCachedPage`), jadi tidak ada fetch ganda — ikut menikmati Pola B caching dari Foundation.

```tsx
// app/(marketing)/[...slug]/page.tsx
import type { Metadata } from 'next'
import { getCachedPage } from '@/lib/cms/queries'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Metadata> {
  const { slug } = await params // params async di Next 16
  const path = slug?.join('/') ?? 'home'
  const page = await getCachedPage(path)
  if (!page) return {}

  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    alternates: { canonical: `/${path}` },         // canonical per-halaman
    openGraph: {
      title: page.seo?.title ?? page.title,
      description: page.seo?.description,
      url: `/${path}`,
      images: page.seo?.ogImage ? [{ url: page.seo.ogImage }] : undefined,
    },
    robots: page.seo?.noindex ? { index: false, follow: false } : undefined,
  }
}
```

Tiga hal penting: **canonical per-halaman** (cegah duplicate content), **fallback** `seo.title` → `title`, dan **toggle `noindex`** yang dikontrol editor dari CMS (untuk landing kampanye yang tak ingin diindeks).

### 2.5 Open Graph image dinamis

```tsx
// app/(marketing)/[...slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getCachedPage } from '@/lib/cms/queries'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const page = await getCachedPage(slug?.join('/') ?? 'home')
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center',
        width: '100%', height: '100%', padding: 80, background: '#0f172a', color: '#fff' }}>
        <div style={{ fontSize: 64, fontWeight: 700 }}>{page?.title ?? 'Your Company'}</div>
        <div style={{ fontSize: 28, color: '#94a3b8', marginTop: 20 }}>yourcompany.com</div>
      </div>
    ),
    size,
  )
}
```

Metadata berbasis file punya prioritas lebih tinggi dan meng-override metadata berbasis config, jadi `opengraph-image.tsx` otomatis mengisi tag `og:image`.

### 2.6 Streaming metadata & bot

Next.js 16 melakukan streaming metadata. Untuk Googlebot (yang mengeksekusi JS & memeriksa DOM penuh), metadata sudah diverifikasi terbaca dengan benar; untuk bot terbatas-HTML (mis. facebookexternalhit), metadata tetap memblokir rendering agar tersedia. Deteksi bot otomatis lewat User Agent, dengan opsi `htmlLimitedBots` di config. Praktisnya: kamu tidak perlu khawatir tag terlewat.

### 2.7 Hindari — metadata

- ❌ Tanpa `metadataBase` — URL OG/canonical relatif tak ter-resolve.
- ❌ Title/description sama di semua halaman — duplicate.
- ❌ `themeColor`/`viewport` di dalam object `metadata` — deprecated.
- ❌ Lupa canonical per-halaman — duplicate content.
- ❌ Fetch terpisah di `generateMetadata` dan page — pakai query ber-cache yang sama.
- ❌ `generateMetadata` di Client Component — hanya jalan di Server Component.
- ❌ OG image bukan 1200×630 — preview terpotong.

---

## 3. Structured Data (JSON-LD)

JSON-LD berfungsi ganda: rich results di SERP **dan** pemahaman entitas oleh AI. Di 2026, dengan AI Overviews & Copilot bergantung pada konten terstruktur, sistem AI memakai structured data untuk memahami dan mengutip konten — tanpanya, konten tak terlihat oleh lapisan AI discovery. Tapi realistis: structured data memungkinkan rich result & pemahaman, bukan sihir ranking.

### 3.1 Pola injeksi yang aman

Rekomendasi resmi Next.js: render JSON-LD sebagai `<script>` di Server Component (`layout`/`page`) agar masuk HTML awal. **Tapi `JSON.stringify` tidak mensanitasi XSS** — buat komponen aman yang meng-escape `<`:

```tsx
// components/json-ld.tsx → Server Component
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c') // cegah breakout </script>
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
```

### 3.2 Schema mana yang berdampak

| Schema | Letak | Manfaat |
|---|---|---|
| **Organization** | Global (root layout) | Identitas brand, knowledge panel, dikutip AI |
| **WebSite** | Global (root layout) | Sitelinks searchbox, entitas situs |
| **BreadcrumbList** | Per halaman | Breadcrumb di SERP |
| **FAQPage** | Halaman dengan FAQ | Accordion FAQ di SERP & AI |
| **SoftwareApplication** / **Product** + **Offer** | Pricing | Rich result harga |

### 3.3 Organization + WebSite (global)

Pakai pola `@graph` agar entitas terhubung lewat `@id`:

```tsx
// app/layout.tsx (render di dalam <body>)
import { JsonLd } from '@/components/json-ld'

const SITE = 'https://yourcompany.com'

const globalGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Your Company',
      url: SITE,
      logo: `${SITE}/logo.png`,
      sameAs: [
        'https://twitter.com/yourcompany',
        'https://www.linkedin.com/company/yourcompany',
        'https://github.com/yourcompany',
      ],
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@yourcompany.com' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'Your Company',
      publisher: { '@id': `${SITE}/#organization` }, // link ke entitas di atas
    },
  ],
}
// di <body>: <JsonLd data={globalGraph} />
```

`sameAs` (profil sosial resmi) membantu mesin & AI mengkonfirmasi identitas brand sebagai satu entitas.

### 3.4 FAQPage dari CMS

Bangun dari data CMS (blok FAQ via reference dari Content Modeling), render **hanya jika FAQ benar-benar tampil**:

```ts
// lib/seo/faq-schema.ts
export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}
```

**Aturan keras Google:** markup FAQ harus mencerminkan konten yang terlihat di halaman. Menandai FAQ tersembunyi = pelanggaran kebijakan.

### 3.5 Validasi

Validasi dengan Rich Results Test (Google) atau Schema Markup Validator. Idealnya masukkan ke CI agar markup rusak ketahuan sebelum produksi.

### 3.6 Hindari — structured data

- ❌ Markup konten yang tidak terlihat (FAQ/review tersembunyi).
- ❌ `JSON.stringify` tanpa escape `<` (XSS).
- ❌ Injeksi via `useEffect`/Client Component (tak ada di HTML awal).
- ❌ Data palsu (rating fiktif) — penalti.
- ❌ Organization diduplikasi & konflik — taruh sekali di root pakai `@id`.
- ❌ `@type` salah / properti wajib hilang.
- ❌ Over-marking semua hal.

---

## 4. Sitemap & Robots

Dua file kecil tapi krusial: `sitemap.ts` (peta URL) dan `robots.ts` (aturan akses). Keduanya konvensi file-based yang di-render server dan di-cache default kecuali memakai Request-time API.

### 4.1 Sitemap dinamis dari CMS

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getAllPageSlugs } from '@/lib/cms/queries'

const SITE = 'https://yourcompany.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getAllPageSlugs() // published & non-noindex, ber-cache

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ]
  const cmsRoutes: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${SITE}/${p.slug}`,
    lastModified: new Date(p.updatedAt), // tanggal asli dari CMS
    changeFrequency: 'monthly',
    priority: 0.7,
  }))
  return [...staticRoutes, ...cmsRoutes]
}
```

Aturan: jaga tiap sitemap di bawah 50 MB atau 50.000 URL (pakai index file jika lebih); hanya halaman canonical berstatus 200; perbarui `lastmod`.

**Catatan jujur:** Google sebagian besar mengabaikan `priority` & `changeFrequency` — sinyal yang dipakai adalah `lastModified`. Prioritaskan akurasi `lastmod` dari `_updatedAt` CMS. Untuk skala besar, pakai `generateSitemaps`.

### 4.2 robots.ts environment-aware (jebakan)

Static `robots.txt` di Vercel disajikan identik di produksi dan setiap URL preview, sehingga Google bisa mengindeks preview → duplicate content. Solusinya: `robots.ts` dinamis yang blokir total di non-produksi.

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

const SITE = 'https://yourcompany.com'
const isProd = process.env.VERCEL_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProd) return { rules: { userAgent: '*', disallow: '/' } } // preview: jangan diindeks

  return {
    rules: [
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      // Crawler AI answer — IZINKAN agar muncul di jawaban AI
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      // Crawler training-only — keputusan kebijakan
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: '*', allow: '/', disallow: ['/api/', '/studio/'] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
```

### 4.3 Keputusan crawler AI

Ada dua kategori crawler AI dengan keputusan berbeda:

| Bot | Tujuan | Rekomendasi |
|---|---|---|
| Googlebot, Bingbot | Index pencarian | **Allow** |
| OAI-SearchBot, ChatGPT-User | Jawaban ChatGPT | **Allow** |
| PerplexityBot | Jawaban Perplexity | **Allow** |
| ClaudeBot | Jawaban Claude | **Allow** |
| GPTBot | Training OpenAI | Pilihan kebijakan |
| Google-Extended | Training Gemini | Pilihan kebijakan |
| CCBot | Common Crawl (training) | Pilihan kebijakan |

Untuk landing page marketing, kamu ingin terlihat di jawaban AI — izinkan crawler answer (ChatGPT-User, PerplexityBot, ClaudeBot, OAI-SearchBot); blokir crawler training-only jika tak ingin konten dipakai melatih model. Memblokir crawler answer lalu berharap dikutip AI adalah kesalahan umum.

### 4.4 Hindari — sitemap & robots

- ❌ Static `robots.txt` di Vercel (preview terindeks).
- ❌ Sitemap memuat URL non-canonical / redirect / noindex / 404.
- ❌ `lastModified` dummy — pakai `_updatedAt` asli.
- ❌ Men-disallow `/_next/` atau aset statis.
- ❌ Lupa mereferensikan sitemap di robots.
- ❌ Memblokir crawler AI answer lalu berharap dikutip.
- ❌ Sitemap hardcoded yang melenceng dari CMS.

---

## 5. SEO Friendly (On-Page & Teknis)

Banyak fondasi (static-first, client islands, next/font) sudah jadi keunggulan SEO.

### 5.1 Urutan prioritas

Kebenaran fundamental: Google tidak bisa me-ranking halaman yang tak bisa di-crawl & di-index, dan kegagalan crawlability adalah masalah paling merusak. Urutan benar: **crawlability & indexing → rendering (konten di HTML mentah sebelum JS) → robots → schema → Core Web Vitals → internal linking → arsitektur**.

### 5.2 Rendering: fondasi kita sudah jadi kemenangan

Server Components mengirim HTML ter-render penuh ke mesin pencari tanpa eksekusi JavaScript. Keputusan static-first (Pola B) berarti crawler & AI menerima konten lengkap di HTML awal — bukan shell kosong seperti SPA lama.

### 5.3 Semantic HTML & hierarki heading

Prinsip kunci: hierarki heading yang masuk akal bagi screen reader juga masuk akal bagi LLM — accessibility dan AI-readability adalah hal yang sama.

```tsx
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header><nav aria-label="Primary">{/* navigasi */}</nav></header>
      <main>{children}</main>
      <footer>{/* footer */}</footer>
    </>
  )
}
```

Aturan: **tepat satu `<h1>` per halaman** (judul hero), section lain `<h2>`, sub-bagian `<h3>` — tidak melompat level.

```tsx
// hero → satu-satunya h1
export function Hero({ heading, subheading }: HeroProps) {
  return <section><h1>{heading}</h1><p>{subheading}</p></section>
}
// features → h2
export function Features({ heading }: FeaturesProps) {
  return (
    <section aria-labelledby="features-heading">
      <h2 id="features-heading">{heading}</h2>
    </section>
  )
}
```

### 5.4 Internal linking

Crawler menemukan & menilai halaman lewat link internal. Pakai `next/link` dengan anchor text deskriptif:

```tsx
import Link from 'next/link'
// ❌ <Link href="/pricing">klik di sini</Link>
// ✅ <Link href="/pricing">Lihat paket harga & fitur</Link>
```

Pastikan tiap halaman penting punya ≥1 link internal masuk (tidak orphan).

### 5.5 Gambar — LCP & CLS

```tsx
import Image from 'next/image'

export function Hero({ heading, image, imageAlt }: HeroProps) {
  return (
    <section>
      <h1>{heading}</h1>
      <Image src={image} alt={imageAlt} width={1200} height={600} priority />
    </section>
  )
}
```

`alt` dari CMS — jadikan field **required** di schema. Gambar hero (LCP) pakai `priority`, jangan lazy-load.

### 5.6 Skrip pihak ketiga — biang INP buruk

```tsx
import Script from 'next/script'
<Script src="https://analytics.example.com/s.js" strategy="afterInteractive" />
<Script src="https://chat.example.com/widget.js" strategy="lazyOnload" />
```

### 5.7 Core Web Vitals 2026

| Metrik | Mengukur | Target | Penyebab gagal umum |
|---|---|---|---|
| **LCP** | Loading konten terbesar | < 2.5s | Gambar hero tak dioptimasi, server lambat |
| **INP** | Responsivitas interaksi | < 200ms | Skrip pihak ketiga berat, JS sinkron |
| **CLS** | Stabilitas layout | < 0.1 | Gambar tanpa dimensi, font swap |

INP (menggantikan FID) adalah CWV yang paling sering gagal di 2026 — penyebabnya skrip pihak ketiga berat, komponen tak dioptimasi, dan JS sinkron. Disiplin client island dari Foundation terbayar di sini. Audit dengan `@next/bundle-analyzer` (`ANALYZE=true next build`). Perspektif jujur: CWV satu sinyal di antara ratusan — CWV baik tak mengalahkan konten buruk, tapi CWV buruk mencegah konten bagus mencapai potensi rankingnya.

### 5.8 Hindari — SEO on-page

- ❌ Lebih dari satu `<h1>` atau heading melompat level.
- ❌ Fetch konten utama di client (`useEffect`) — HTML kosong.
- ❌ `force-dynamic` di landing page.
- ❌ Anchor text generik tanpa konteks.
- ❌ Gambar tanpa `width`/`height` (CLS) atau hero tanpa `priority` (LCP).
- ❌ `alt` kosong untuk gambar bermakna.
- ❌ Skrip pihak ketiga render-blocking — INP hancur.
- ❌ Orphan pages.
- ❌ `<div onClick>` pengganti link/button.

---

## 6. GEO / AI Search

### 6.1 Pergeseran & kenapa sekarang

GEO (Generative Engine Optimization) adalah praktik menyusun konten agar mesin AI — ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude — mengutipnya saat menjawab; tujuannya jadi bagian dari jawaban, bukan sekadar link ter-ranking. Mesin AI search kini menangani sekitar 12–18% query informasional berbahasa Inggris, naik dari di bawah 2% setahun lalu.

### 6.2 GEO vs SEO: lapisan tambahan, bukan pengganti

Panduan resmi Google 2026: mengoptimasi untuk AI search generatif "tetaplah SEO". Bahkan Google menyatakan llms.txt, penulisan ulang khusus-AI, dan schema khusus tidak diperlukan untuk fitur generatifnya — fondasi yang sama berlaku (konten berguna, crawlable, struktur jelas, page experience tepercaya). Artinya: semua yang dibangun di pilar #2–#5 adalah ~80% dari GEO. Bab ini menambahkan extractability & authority.

### 6.3 Bagaimana AI memilih sumber

LLM menjawab lewat RAG (retrieval-augmented generation) — menarik passage teks spesifik, dan konten harus cocok dengan cara orang menyusun pertanyaan. Yang dikutip bukan "halaman ranking #1", tapi passage yang paling mudah diekstrak dan menjawab langsung.

### 6.4 Taktik extractability (yang dev kontrol)

1. **Answer-first.** Tiap section membuka dengan jawaban langsung; kalimat pertama harus self-contained.
2. **Struktur Q&A & heading deskriptif.** Heading semantik dari #5 langsung membayar. Sertakan section FAQ.
3. **Spesifisitas faktual.** Angka & data konkret lebih sering dikutip ("kurangi waktu deploy 40%" > "mempercepat deployment").
4. **Schema & semantic HTML.** JSON-LD (#3) & HTML semantik (#5) adalah "API" yang dipakai AI membaca halaman.
5. **Freshness.** Konten yang diperbarui dalam 30 hari menerima 3,2× lebih banyak sitasi AI; 85% sitasi AI Overview dari konten 2 tahun terakhir. Pastikan `dateModified` akurat:

```ts
// lib/seo/webpage-schema.ts
export function buildWebPageSchema(page: { title: string; slug: string; updatedAt: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    url: `https://yourcompany.com/${page.slug}`,
    dateModified: page.updatedAt, // sinkron dengan sitemap lastmod
  }
}
```

### 6.5 llms.txt — "sitemap untuk AI"

```ts
// app/llms.txt/route.ts
import { getAllPageSlugs } from '@/lib/cms/queries'

const SITE = 'https://yourcompany.com'

export async function GET() {
  const pages = await getAllPageSlugs() // ber-cache, sama seperti sitemap
  const body = [
    '# Your Company',
    '',
    '> Platform [deskripsi satu kalimat tentang apa yang kalian lakukan].',
    '',
    '## Halaman utama',
    ...pages.map((p) => `- [${p.title}](${SITE}/${p.slug}): ${p.summary ?? ''}`),
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
```

**Kejujuran soal llms.txt:** Google bilang ini tidak diperlukan untuk fitur AI-nya, dan adopsi antar mesin masih beragam. Perlakukan sebagai *langkah murah* — murah (apalagi query CMS sudah ada), tak merugikan, mungkin berguna untuk agen tertentu. Jangan jadikan prioritas utama.

> **Catatan modeling:** field `summary` (TL;DR ~1 kalimat) per halaman berguna ganda — mengisi `llms.txt` dan meta description. Pertimbangkan blok "Key takeaways" answer-first untuk extractability.

### 6.6 Akses crawler

Agar bisa dikutip, mesin AI harus bisa crawl. Dua langkah yang sering terlewat: ChatGPT meng-index lewat Bing — submit sitemap ke Bing Webmaster Tools untuk membuka kelayakan sitasi ChatGPT; Claude meng-index lewat Brave Search yang punya crawler terpisah. Plus `robots.ts` (#4) sudah mengizinkan crawler answer.

### 6.7 Off-page: authority

Sebagian GEO di luar kode tapi memengaruhi sitasi. Sumber primer dikutip lebih dulu — Reddit menyumbang 46,7% sitasi Perplexity, diikuti Quora, LinkedIn, GitHub, forum industri; untuk SaaS, berkontribusi genuine di komunitas Reddit & GitHub efektif. Kabar baik: website first-party menyumbang 44% sitasi — brand bisa mengendalikan sumber ini.

### 6.8 Pengukuran

GEO belum punya "Search Console". Yang berhasil: jalankan satu set query target melalui ChatGPT, Claude, Perplexity, Gemini tiap minggu, dokumentasikan sumber mana yang dikutip — manual tapi memperlihatkan ground truth. Lacak frekuensi munculnya brand vs kompetitor.

### 6.9 Hindari — GEO

- ❌ Memperlakukan GEO sebagai pengganti SEO.
- ❌ Memblokir crawler AI answer di robots.
- ❌ Membangun suspense sebelum menjawab — bunuh extractability.
- ❌ Membiarkan konten basi — kehilangan boost freshness.
- ❌ Klaim umum tanpa angka.
- ❌ Spam Reddit/forum dengan link — kontribusi harus genuine.
- ❌ Menggantungkan semua pada llms.txt.

---

## 7. Bagaimana Semuanya Terhubung

Lima pilar Discoverability bukan silo — semuanya bertumpu pada satu sumber konten (CMS) dan satu lapisan teknis, lalu bercabang melayani pencarian klasik dan AI search sekaligus:

```
1. Konten tunggal di CMS (Sanity) — sumber kebenaran
        ↓
2. Lapisan teknis dari CMS yang sama: generateMetadata + JSON-LD + sitemap.ts + robots.ts + llms.txt
        ↓
3. Disajikan sebagai HTML statis penuh (Pola B) — crawler tak butuh eksekusi JS
        ↓
4. Crawler masuk: Googlebot & Bingbot (klasik) + ChatGPT/Brave/Perplexity (AI answer)
        ↓
5. Mesin memproses: index + ekstraksi passage (RAG) + baca entitas (schema)
        ↓
6. Hasil ganda: Rich results di SERP + Sitasi di jawaban AI
```

Setiap pilar menopang yang lain:

- **Metadata + canonical** mencegah duplicate, memberi crawler judul/deskripsi bersih.
- **JSON-LD** memberi makna entitas — dipakai rich results *dan* pemahaman AI.
- **Sitemap & robots** mengatur siapa boleh masuk; keputusan crawler AI menentukan kelayakan sitasi.
- **SEO on-page** (HTML semantik) sekaligus jadi extractability untuk AI.
- **GEO** menambahkan freshness, answer-first, dan authority di atas semuanya.

Karena semua ditarik dari satu sumber CMS lewat query ber-cache yang sama, tidak ada drift dan tidak ada fetch ganda — konsistensi metadata, structured data, sitemap, dan llms.txt terjaga otomatis.

---

## 8. Referensi

Fakta versi, API, dan data diverifikasi terhadap dokumentasi resmi dan sumber industri (Juni 2026):

- Dokumentasi resmi Next.js — Metadata API, `generateMetadata`, `generateViewport`, JSON-LD guide, Metadata Files (robots, sitemap).
- Panduan SEO/teknis Next.js 2026 dari berbagai praktisi independen (Digital Applied, Strapi, ModernWebSEO, Bravix, dan lainnya).
- Panduan & riset GEO 2026 (Enrich Labs, Geoptie, AI Magicx, Heeya, Mersel AI, seoTuners, Tech Times) — termasuk data sitasi AI (Yext) dan posisi resmi Google soal "GEO tetaplah SEO".
- Panduan structured data & crawler AI (Cosmic, agentmarkup, zerokit) — termasuk daftar crawler AI dan kebijakan akses.

*Detail data, versi, dan kebijakan dapat berubah cepat (terutama GEO); verifikasi ulang sebelum keputusan final.*
