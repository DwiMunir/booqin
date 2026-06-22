# Master Guidelines — Landing Page Perusahaan
### Panduan Implementasi Padat: Sintesis Enam Kartu Riset (Next.js 16, Self-Hosted)

*Dokumen ringkas internal · Disusun Juni 2026 · Rujukan mendalam: enam PDF riset per kartu*

---

## Daftar Isi

0. [Filosofi & Lima Prinsip Inti](#0-filosofi--lima-prinsip-inti)
1. [Stack & Keputusan Inti](#1-stack--keputusan-inti)
2. [Foundation — Rendering & Arsitektur](#2-foundation--rendering--arsitektur)
3. [Discoverability — SEO & AI Search](#3-discoverability--seo--ai-search)
4. [Performance](#4-performance)
5. [UX & Reliability](#5-ux--reliability)
6. [Quality & Ops](#6-quality--ops)
7. [Forms & Compliance](#7-forms--compliance)
8. [Arsitektur Terpadu](#8-arsitektur-terpadu)
9. [Checklist Implementasi Bertahap](#9-checklist-implementasi-bertahap)
10. [Hal yang Harus Dihindari](#10-hal-yang-harus-dihindari)
11. [Referensi](#11-referensi)

---

## 0. Filosofi & Lima Prinsip Inti

Seluruh riset bermuara pada satu tesis: **keputusan arsitektur yang sama terbayar di setiap kartu.** Memilih static-first + CDN + client islands + compliance-by-design bukan enam keputusan terpisah — ia satu fondasi yang sekaligus memberi LCP/INP bagus (Performance), SEO & AI-readability kuat (Discoverability), CSP yang mempertahankan caching (Quality & Ops), dan privasi yang sederhana (Forms & Compliance).

Lima prinsip yang berulang di semua kartu:

1. **Static-first, render dinamis hanya untuk yang personal.** Halaman di-prerender statis; bagian personal jadi "dynamic hole" via Suspense.
2. **Server Components default, client islands sekecil mungkin.** `'use client'` di leaf interaktif, bukan di page/layout — ini biang INP buruk #1 sekaligus bloat JS.
3. **Satu sumber kebenaran (CMS), ditarik via query ber-cache yang sama.** Tidak ada drift, tidak ada fetch ganda.
4. **Ukur dulu, tegakkan di gerbang.** RUM + lab sebelum optimasi; lint/test/perf di CI sebelum merge.
5. **Compliance & proteksi by design.** Cookieless, data minimal, CSP statis — memilih arsitektur yang membuat sebagian kewajiban hilang sendiri.

---

## 1. Stack & Keputusan Inti

| Area | Keputusan | Alasan singkat |
|---|---|---|
| Framework | **Next.js 16.2.x**, App Router, Turbopack | Cache Components, static-first, RSC |
| Runtime | **Node ≥ 20.9** (bukan edge) | Cache Components & `proxy.ts` butuh Node |
| UI | **React 19.2 + React Compiler** | Auto-memoization, INP |
| Bahasa/tooling | **TypeScript strict, Biome, Vitest** | `next lint` dihapus; Biome lint+format |
| CMS | **Sanity** (Studio di repo terpisah) | Schema-as-code, Portable Text, localized |
| Email | **Resend** (+ React Email) | Server Action, audience, transaksional |
| Styling | **Tailwind v4** | Container queries, `@theme`, fluid tokens |
| Hosting | **Self-hosted** (Docker standalone) | Kontrol penuh |
| Konfigurasi inti | `cacheComponents: true`, `output: 'standalone'`, `typedRoutes: true`, `reactCompiler: true`, `optimizePackageImports` | Lihat per-kartu |

**Aturan env:** secret server tanpa prefix `NEXT_PUBLIC_`; validasi semua via `lib/env.ts` (zod, fail-fast saat build). `NEXT_PUBLIC_*` di-bake saat build (build-args di CD); secret server diberikan saat runtime.

---

## 2. Foundation — Rendering & Arsitektur

**Keputusan inti:** Static-first dengan **Pola B** — konten CMS di-cache penuh, di-invalidasi on-demand lewat webhook. Halaman = array blok dari Sanity yang dipetakan ke komponen via registry.

**Yang wajib:**
- Konten CMS via `'use cache'` + `cacheLife('max')` + `cacheTag('page:<slug>')`.
- Webhook Sanity → `revalidateTag(tag, 'max')` (argumen kedua wajib).
- Block-renderer: blok tak dikenal di-skip (tak crash).
- Query CMS hanya di `lib/cms/`. Struktur: route group `(marketing)`, env validation, RSC default.
- `'use client'` hanya di leaf interaktif. Tidak bisa unit-test async Server Component → pakai E2E.

**Pola kunci — query ber-cache + webhook:**
```ts
// lib/cms/queries.ts
export async function getCachedPage(slug: string) {
  'use cache'
  cacheLife('max')
  cacheTag(`page:${slug}`)
  return sanityClient.fetch(PAGE_QUERY, { slug })
}
```
```ts
// app/api/revalidate/route.ts (verifikasi secret dulu)
revalidateTag(`page:${slug}`, 'max')
```

**Pola kunci — block-renderer:**
```tsx
const registry = { hero: Hero, features: Features, cta: Cta } as const
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b) => {
    const C = registry[b._type as keyof typeof registry]
    return C ? <C key={b._key} {...b} /> : null // skip blok tak dikenal
  })}</>
}
```

**Jebakan:** `fetch` di Next 16 default `no-store` (opt-in cache eksplisit). Tag spesifik per halaman, jangan global.

---

## 3. Discoverability — SEO & AI Search

**Keputusan inti:** Fondasi teknis yang sama menopang pencarian klasik & AI search. Semua sinyal ditarik dari CMS yang sama. GEO = lapisan aditif di atas SEO kuat, bukan disiplin terpisah.

**Yang wajib:**
- `metadataBase` + `title.template` di root; `viewport`/`themeColor` via **export `viewport` terpisah**.
- `generateMetadata` per halaman dari CMS + **canonical per-halaman** + toggle `noindex`.
- JSON-LD `Organization` + `WebSite` (`@graph`, **escape `<`**); `FAQPage` hanya jika FAQ tampil.
- `sitemap.ts` & `robots.ts` dinamis; `robots.ts` **env-aware** (noindex non-produksi); `lastModified` dari `_updatedAt`.
- HTML semantik, **tepat satu `<h1>`**, anchor deskriptif (= extractability untuk AI).
- Izinkan crawler AI answer (ChatGPT-User, PerplexityBot, ClaudeBot, OAI-SearchBot); blokir training-only sesuai kebijakan.
- GEO: answer-first, freshness (`dateModified` akurat), `llms.txt` (langkah murah).

**Pola kunci — metadata + canonical:**
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await getCachedPage((await params).slug.join('/'))
  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    alternates: { canonical: `/${path}` },
    robots: page.seo?.noindex ? { index: false, follow: false } : undefined,
  }
}
```

**Pola kunci — JSON-LD aman (anti-XSS):**
```tsx
const json = JSON.stringify(data).replace(/</g, '\\u003c')
return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
```

**Jebakan:** static `robots.txt` membuat preview ter-index → pakai `robots.ts` env-aware. Markup JSON-LD harus cerminkan konten yang tampil.

---

## 4. Performance

**Keputusan inti:** Performa = disiplin berkelanjutan yang dimulai dari pengukuran. Ukur dulu (lab + field/RUM), fix per metrik, jaga dengan gerbang CI.

**Target (P75):** LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1.

**Yang wajib:**
- **RUM** sejak awal: `<WebVitals/>` (`useReportWebVitals`) → `/api/vitals`.
- **LCP**: TTFB minimal (static+CDN), gambar hero `priority`. Diagnosis elemen LCP dulu.
- **INP**: kurangi client JS (RSC/island), `useTransition` untuk kerja berat, audit `'use client'` & skrip pihak ketiga.
- **CLS**: dimensi gambar (`next/image`), `size-adjust` font (`next/font`), reservasi ruang dynamic hole.
- **Image**: `next-sanity/image` (offload ke CDN Sanity), SELALU `sizes`, `quality` eksplisit, blur dari LQIP.
- **Font**: `next/font` module-level, subset latin, variable, CSS var (anti-CLS otomatis).
- **Bundle**: server-first, `next/dynamic` widget berat, `optimizePackageImports`, React Compiler; Bundle Analyzer; budget < 200KB di CI.
- **Caching** lima lapisan: Request Memoization · `'use cache'` · Full Route Cache · CDN edge · Client Router Cache.

**Pola kunci — RUM leaf:**
```tsx
'use client'
import { useReportWebVitals } from 'next/web-vitals'
export function WebVitals() {
  useReportWebVitals((m) => navigator.sendBeacon('/api/vitals', JSON.stringify(m)))
  return null
}
```

**Jebakan kritis (CDN vs revalidation):** caching CDN saja TIDAK mendukung on-demand revalidation — `revalidateTag` meng-invalidasi server cache Next, tapi CDN generik tetap menyajikan versi lama sampai TTL habis. Di belakang CDN generik, webhook harus **purge CDN juga**. INP tak terukur penuh di lab → pakai TBT proksi di CI, INP nyata dari RUM.

---

## 5. UX & Reliability

**Keputusan inti:** UI tangguh menangani setiap kondisi — semua perangkat, input, state data, dan kegagalan — dengan degradasi anggun & jalan pulih.

**Yang wajib:**
- **Responsive**: mobile-first + container queries (`@container`) + fluid `clamp()` + `dvh`; tes perangkat nyata (Safari iOS!).
- **A11y (WCAG 2.2 AA)**: semantik dulu/ARIA terakhir, keyboard penuh, `:focus-visible` (≥3:1), skip link, form berlabel + error via `aria-live`, ikon `aria-label`, kontras 4.5:1; `vitest-axe` di CI.
- **States**: Suspense + `loading.tsx` + skeleton (`motion-safe`); empty state yang mengarahkan; error boundary + retry; `prefers-reduced-motion` global.
- **Error pages**: `not-found.tsx` (Server, 404 yang membantu + tracking), `error.tsx` (Client, `reset`, `digest`), `global-error.tsx` (html/body, inline style).

**Pola kunci — responsive komponen reusable:**
```tsx
<div className="@container">
  <article className="flex flex-col @md:flex-row gap-4">...</article>
</div>
```

**Pola kunci — error.tsx:**
```tsx
'use client'
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error), [error])
  return <div role="alert"><button onClick={reset}>Coba lagi</button></div>
}
```

**Jebakan:** `error.tsx` wajib `'use client'`; `global-error.tsx` wajib `<html>`/`<body>` (import CSS diabaikan). `notFound()` presedensi di atas `error.tsx`. Produksi tak membocorkan pesan error → andalkan `digest`.

---

## 6. Quality & Ops

**Keputusan inti:** Kualitas ditegakkan otomatis sepanjang siklus: test → gerbang CI → hardening → deploy aman → observasi → alert.

**Yang wajib:**
- **E2E (Playwright)**: locator `getByRole` (= cek a11y), web-first assertion, alur kritis (termasuk async Server Component & form), `@axe-core/playwright`. `webServer` build+start.
- **CI/CD**: gerbang `lint → typecheck → test → build → E2E → Lighthouse` dengan caching; Docker multi-stage standalone (non-root); CD self-host (build→push GHCR→deploy SSH), tag per-SHA (rollback).
- **Security**: **CSP statis** via `next.config` (BUKAN nonce — nonce memaksa dinamis & merusak static); header lengkap (HSTS env-aware, `frame-ancestors`, nosniff, Referrer-Policy, Permissions-Policy); rollout report-only.
- **Monitoring**: Sentry (`instrumentation.ts`, `onRequestError`, source map) + uptime eksternal + `/api/health` internal + log terstruktur (`correlationId`) + RUM + alert.

**Pola kunci — security headers (mempertahankan static):**
```ts
const csp = ["default-src 'self'", "script-src 'self' 'unsafe-inline'",
  "frame-ancestors 'none'", "object-src 'none'", 'upgrade-insecure-requests'].join('; ')
async headers() {
  return [{ source: '/:path*', headers: [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // HSTS hanya produksi
  ]}]
}
```

**Pola kunci — health check internal (bukan sekadar "200"):**
```ts
export async function GET() {
  try { await getCachedPage('home'); return Response.json({ status: 'ok' }) }
  catch { return Response.json({ status: 'degraded' }, { status: 503 }) }
}
```

**Jebakan:** jangan andalkan `proxy.ts` untuk auth (bisa di-bypass, CVE) — verifikasi di data boundary. Secret server jangan jadi build-arg. Monitoring tool jangan menambah blocking time (Sentry bolt-on bisa +200ms). Instrumentasi sejak awal (kode dari agent sering tanpa observability).

---

## 7. Forms & Compliance

**Keputusan inti:** Form efektif itu terlindungi, patuh, & tanpa friksi. Kumpulkan benar, tangkis bot berlapis, hormati privasi by design, lokalkan hanya saat data membenarkan.

**Yang wajib:**
- **Resend**: Server Action (`'use server'`), validasi zod, simpan ke Audience (`contacts.create`), konfirmasi via React Email (`@react-email/components`, properti `react`). Domain terverifikasi (SPF/DKIM/DMARC).
- **Anti-spam berlapis** (urut termurah): honeypot (silent drop, nama `website`) → time check (<2s = bot) → rate limit per-IP (Upstash) → Turnstile invisible (opsional, server-verify).
- **Privacy**: pisahkan cookie-consent vs form-consent; stack cookieless → kemungkinan **tanpa banner**; checkbox consent **tidak pre-checked**; data minimization; privacy policy. (Bukan nasihat hukum — verifikasi UU PDP/GDPR.)
- **i18n**: `next-intl`, `localePrefix: 'always'`, `setRequestLocale` (jaga static!), konten native per locale (jangan auto-translate), hreflang + `x-default`. Tunda sampai data membenarkan.

**Pola kunci — Server Action berlapis:**
```ts
'use server'
export async function joinWaitlist(_prev, formData) {
  if (formData.get('website')) return { ok: true }           // honeypot silent drop
  const parsed = schema.safeParse({ /* email, consent, ts */ })
  if (!parsed.success) return { ok: false, error: 'invalid' }
  if (Date.now() - parsed.data.ts < 2000) return { ok: true } // time check
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!(await ratelimit.limit(ip)).success) return { ok: false, error: 'rate' }
  await resend.contacts.create({ email, audienceId, unsubscribed: false })
  await resend.emails.send({ from, to: [email], react: WaitlistWelcome({ email }) })
  return { ok: true }
}
```

**Jebakan:** honeypot harus silent-drop (kembalikan sukses); CAPTCHA terlihat hilangkan 15% pendaftar (pakai Turnstile invisible); cookieless tetap mungkin butuh consent jika proses PII; `setRequestLocale` wajib agar i18n tak membuat semua halaman dinamis.

---

## 8. Arsitektur Terpadu

Keenam kartu bukan modul terpisah — mereka lapisan di atas fondasi yang sama. Urutan implementasi yang masuk akal:

```
1. Scaffold + konfigurasi inti — Next 16, cacheComponents, output standalone, headers, fonts, env
        ↓
2. Arsitektur static-first — Pola B ('use cache'+cacheTag+webhook), client islands, block-renderer Sanity
        ↓
3. SEO & performa — metadata+canonical+JSON-LD+sitemap/robots, next/image+next/font, bundle budget
        ↓
4. UX & ketangguhan — responsive + a11y + loading/empty/error states + 404/500
        ↓
5. Form & compliance — Resend Server Action + anti-spam berlapis + consent + privacy
        ↓
6. Quality & deploy — test → gerbang CI → Docker standalone → CD self-host → monitoring
```

**Satu keputusan, banyak imbalan** — bagaimana keputusan inti terbayar lintas kartu:

| Keputusan inti | Imbalan lintas kartu |
|---|---|
| **Static-first + CDN** | TTFB/LCP rendah (Perf) · HTML penuh untuk crawler/AI (Disc) · CSP statis tetap bisa (Q&O) |
| **Client islands** | INP rendah & bundle kecil (Perf) · a11y leaf jelas (UX) |
| **Satu sumber CMS + query ber-cache** | Metadata/sitemap/llms.txt konsisten (Disc) · tak ada fetch ganda (Perf) |
| **HTML semantik** | A11y (UX) · AI-readability & SEO (Disc) |
| **Cookieless + data minimal** | Privasi sederhana lintas yurisdiksi (F&C) · monitoring ringan (Q&O) |
| **Gerbang CI + RUM** | Performa tak luntur (Perf) · regresi tertangkap (Q&O) |

Benang merahnya: memilih arsitektur yang benar di awal membuat tiap kartu berikutnya lebih murah — bukan menumpuk enam beban, tapi satu fondasi yang menanggung semuanya.

---

## 9. Checklist Implementasi Bertahap

**Fase 0 — Scaffold [P0]**
- [ ] `create-next-app` (TS, App Router, Biome, alias `@/*`) + `CLAUDE.md` di root
- [ ] `next.config.ts`: `cacheComponents`, `typedRoutes`, `output: 'standalone'`, `images`, `optimizePackageImports`, `reactCompiler`, `headers()` (CSP statis + security headers)
- [ ] `lib/env.ts` (zod), `lib/fonts.ts` (next/font), root layout (font + metadata + `<WebVitals/>`)

**Fase 1 — Landing inti [P0]**
- [ ] Sections semantik (satu `<h1>`), responsive (mobile-first + `@container` + `clamp` + `dvh`), a11y dasar
- [ ] `not-found.tsx` + `error.tsx` + `global-error.tsx`

**Fase 2 — Sanity [P1]**
- [ ] Studio repo terpisah; `getCachedPage` (`'use cache'`+`cacheTag`); block-renderer; webhook `revalidate` (+ purge CDN jika perlu); TypeGen

**Fase 3 — Form Resend [P1]**
- [ ] Server Action berlapis (honeypot+time+rate limit+zod), `contacts.create` + konfirmasi React Email, consent checkbox, verifikasi domain DNS

**Fase 4 — SEO & performa [P1]**
- [ ] `generateMetadata`+canonical+OG, JSON-LD Organization/WebSite, `sitemap.ts`+`robots.ts` env-aware, `next-sanity/image`+`sizes`, Lighthouse

**Fase 5 — Quality & deploy [P0]**
- [ ] Playwright (alur kritis + axe), gerbang CI lengkap, Dockerfile standalone, CD SSH, Sentry + `/api/health` + RUM
- [ ] Smoke test: live, form → audience, edit Sanity → publish → update

**Tunda sampai data membenarkan:** i18n (rilis satu bahasa dulu), cookie banner (kalau menambah analytics ber-cookie), Turnstile (kalau spam membandel).

---

## 10. Hal yang Harus Dihindari

**Arsitektur & rendering**
- ❌ `'use client'` di page/layout; fetch konten utama di `useEffect`; `force-dynamic` di landing page; cache tag global.

**SEO**
- ❌ Lebih dari satu `<h1>`; lupa canonical; JSON-LD tanpa escape `<`; static `robots.txt` (preview terindeks); blokir crawler AI answer lalu berharap dikutip.

**Performa**
- ❌ Optimasi tanpa ukur; lazy-load gambar LCP; gambar tanpa `sizes`/dimensi; font via `<link>`/`@import`; `revalidateTag` saja di belakang CDN generik.

**UX & a11y**
- ❌ `<div onClick>`; menghapus focus indicator; form error lewat warna saja; happy-path saja (tanpa empty/error); animasi tanpa `prefers-reduced-motion`.

**Quality & Ops**
- ❌ Nonce CSP di situs static-first; `unsafe-eval` di produksi; andalkan `proxy.ts` untuk auth; secret server sebagai build-arg; container root; deploy tanpa CI lulus; monitoring belakangan.

**Forms & Compliance**
- ❌ API key di client; domain tak terverifikasi; honeypot kembalikan error; CAPTCHA terlihat untuk waitlist; checkbox consent pre-checked; memuat analytics sebelum consent; auto-translate konten; lupa `setRequestLocale`.

**Lintas-semua**
- ❌ Secret tanpa validasi env; rate limit in-memory di multi-instance; lupa `cacheComponents: true`.

---

## 11. Referensi

Dokumen ini adalah sintesis padat. Untuk kode lengkap, tabel keputusan rinci, dan sitasi sumber per topik, rujuk enam PDF riset detail:

1. **Foundation** — Rendering, Struktur & DX, Headless CMS, Content Modeling
2. **Discoverability** — Metadata, Structured Data, Sitemap & Robots, SEO, GEO
3. **Performance** — Core Web Vitals, Image, Font, Caching, JS & Bundle, Measurement
4. **UX & Reliability** — Responsive, Accessibility, States, Error pages
5. **Quality & Ops** — E2E, CI/CD, Security, Monitoring
6. **Forms & Compliance** — Resend, Spam, Privacy, i18n

Plus build kit: `CLAUDE.md`, `AGENTS.md`, `BUILD_PLAN.md`.

*Semua fakta diverifikasi terhadap dokumentasi resmi & sumber industri (Juni 2026). Detail dapat berubah; verifikasi ulang sebelum keputusan final. Bagian privacy bukan nasihat hukum.*
