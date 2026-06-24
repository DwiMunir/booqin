# CLAUDE.md

Panduan untuk Claude Code saat membangun **landing page perusahaan** dengan Next.js 16. Baca seluruhnya sebelum mengerjakan task. Aturan di sini **wajib**. Konvensi ini hasil sintesis riset (Foundation, Discoverability, Performance, UX & Reliability, Quality & Ops, Forms & Compliance) dan bersifat umum — bukan untuk satu produk tertentu.

## Konfigurasi proyek (isi dulu)

| Item | Nilai |
|---|---|
| Nama produk | `Booqin` |
| Domain | `https://booqin.moonir.dev` → `NEXT_PUBLIC_SITE_URL` |
| CMS | Sanity (default) — Studio di **repo terpisah** |
| Email/form | Resend |
| Deploy | self-host (Docker standalone) |
| Bahasa | Indonesia, Inggris |

## Commands

```bash
pnpm dev              # dev server (Turbopack)
pnpm build            # production build — HARUS lulus sebelum pindah fase
pnpm start            # next start (Node runtime)
pnpm lint             # Biome
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest + vitest-axe
pnpm test:e2e         # Playwright
```

> `next lint` dihapus di Next 16 dan `next build` tidak menjalankan linter. Jalankan `pnpm lint` & `pnpm typecheck` eksplisit.

## Workflow (cara kerja yang diharapkan)

1. **Kerjakan per fase** sesuai `BUILD_PLAN.md`. Selesaikan & verifikasi satu fase sebelum lanjut.
2. **Setelah tiap perubahan berarti**, jalankan `pnpm typecheck` lalu `pnpm build`. Jangan anggap selesai sebelum keduanya lulus.
3. **Client island sekecil mungkin** — `'use client'` di leaf, bukan di page/layout.
4. **Jangan commit secret.** Semua key lewat env; jangan di Client Component atau prefix `NEXT_PUBLIC_` untuk data rahasia.
5. **Konfirmasi dulu** sebelum operasi destruktif (hapus massal, ubah skema, rewrite besar).
6. **Instrumentasi sejak awal** (Sentry/RUM) — jangan ditunda ke akhir.
7. Tulis perubahan minimal yang menyelesaikan task; jangan refactor di luar scope tanpa diminta.

## Tech stack

- Next.js 16.2.x · App Router · Turbopack · `output: 'standalone'` · `cacheComponents: true`
- Node ≥ 20.9 (Node runtime — bukan edge)
- React 19.2 + React Compiler
- TypeScript strict · Biome (lint+format) · Vitest · Playwright (E2E)
- Sanity (CMS, Studio repo terpisah) · Resend + React Email (form) · Tailwind v4

## Arsitektur — non-negotiable

1. **Static-first.** Halaman di-prerender statis. JANGAN `force-dynamic` di landing page. Bagian personal/live → "dynamic hole" via `<Suspense>`.
2. **Server Components default.** `'use client'` hanya di leaf interaktif terkecil — ini penyebab utama INP buruk & bloat JS.
3. **Konten CMS via Pola B:** `'use cache'` + `cacheLife('max')` + `cacheTag('page:<slug>')`, di-invalidasi webhook → `revalidateTag(tag, 'max')` (argumen kedua wajib).
4. **Block-renderer:** halaman = array blok dari CMS → registry komponen; blok tak dikenal di-skip (tidak crash).
5. **Satu sumber kebenaran.** Query CMS hanya di `lib/cms/`; page & `generateMetadata` pakai query ber-cache yang **sama** (tak ada fetch ganda).
6. `fetch` di Next 16 default `no-store` — opt-in cache eksplisit.

## Struktur folder

```
app/(marketing)/        layout (nav+footer), page.tsx, [...slug]/page.tsx
app/api/revalidate/     webhook CMS
app/api/vitals/         penerima RUM
app/api/health/         health check (cek dependency)
app/actions/            server actions (form)
app/layout.tsx          root: html/body, font, metadata global, JSON-LD, <WebVitals/>
app/sitemap.ts · app/robots.ts · app/not-found.tsx · app/error.tsx · app/global-error.tsx
components/ui/ · components/sections/ · components/block-renderer.tsx
lib/cms/ · lib/env.ts · lib/fonts.ts · lib/seo/ · lib/logger.ts
instrumentation.ts · next.config.ts
```

## Konvensi — Rendering & caching

- Tag cache spesifik per halaman (`page:<slug>`), JANGAN global.
- Lima lapisan cache (Request Memoization · `'use cache'` · Full Route Cache · CDN edge · Client Router Cache via `staleTimes`).
- **CDN vs revalidation:** di Vercel purge CDN otomatis; di **self-host + CDN generik**, webhook `revalidate` harus **purge CDN juga** (revalidateTag tidak mem-purge CDN).

## Konvensi — SEO & AI search

- `metadataBase` + `title.template` di root; `viewport`/`themeColor` via **export `viewport` terpisah** (bukan object `metadata`).
- `generateMetadata` per halaman dari CMS + **canonical per-halaman** + toggle `noindex`.
- JSON-LD `Organization` + `WebSite` (`@graph`, **escape `<`** → `\u003c`); `FAQPage` hanya jika FAQ tampil.
- `sitemap.ts` & `robots.ts` dinamis; `robots.ts` **env-aware** (noindex non-produksi); `lastModified` dari `_updatedAt`.
- **Tepat satu `<h1>`**; HTML semantik (`header/nav/main/section/footer`); anchor deskriptif.
- Izinkan crawler AI answer (ChatGPT-User, PerplexityBot, ClaudeBot, OAI-SearchBot). GEO: answer-first, `dateModified` akurat, `llms.txt` opsional.

## Konvensi — Performance (target P75: LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1)

- **RUM** sejak awal: `<WebVitals/>` (`useReportWebVitals`) → `/api/vitals`.
- **LCP**: TTFB rendah (static+CDN), gambar hero `priority`. **INP**: kurangi client JS, `useTransition` untuk kerja berat. **CLS**: dimensi gambar, `size-adjust` font, reservasi ruang dynamic hole.
- **Image**: `next-sanity/image` (offload ke CDN CMS) atau `next/image`. SELALU `sizes`; `quality` eksplisit (Next 16 allowlist); `blurDataURL` dari LQIP.
- **Font**: `next/font` di `lib/fonts.ts` (module-level, subset, variable, CSS var). JANGAN `<link>`/`@import` Google Fonts.
- **Bundle**: server-first; `next/dynamic` widget berat; `experimental.optimizePackageImports`; `reactCompiler`; budget < 200KB di CI; Bundle Analyzer.

## Konvensi — UX & Reliability

- **Responsive**: mobile-first + container queries (`@container`) + fluid `clamp()` + `dvh`; touch target ≥ 44px; tes Safari iOS.
- **A11y (WCAG 2.2 AA)**: semantik dulu/ARIA terakhir; keyboard penuh; `:focus-visible` (≥ 3:1); skip link; form berlabel + error via `aria-live`; ikon `aria-label`; kontras 4.5:1; `vitest-axe` di CI.
- **States**: Suspense + `loading.tsx` + skeleton (`motion-safe:`); empty state yang mengarahkan; error boundary + retry; `prefers-reduced-motion` global.
- **Error pages**: `not-found.tsx` (Server, 404 membantu + tracking), `error.tsx` (`'use client'`, `reset`, `digest`), `global-error.tsx` (wajib `<html>`/`<body>`, inline style).

## Konvensi — Security

- **CSP STATIS** via `next.config` headers (BUKAN nonce — nonce memaksa rendering dinamis & merusak static). Header lengkap: HSTS env-aware, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Rollout `Content-Security-Policy-Report-Only` dulu.
- JANGAN andalkan `proxy.ts`/middleware untuk otorisasi — verifikasi di data boundary.
- **Server Action = endpoint publik** — validasi (zod) + otorisasi.
- Patch hygiene (npm audit/Dependabot). Secret server-only, JANGAN jadi build-arg.

## Konvensi — Testing & CI/CD

- **E2E (Playwright)**: locator `getByRole` (= cek a11y), web-first assertion, alur kritis (termasuk async Server Component & form), `@axe-core/playwright`. `webServer` build+start. JANGAN hard wait.
- Tak bisa unit-test async Server Component → pakai E2E.
- **CI gate**: `lint → typecheck → test → build → E2E → Lighthouse` dengan caching (deps + `.next` + Docker layer `type=gha`).
- **CD**: Docker multi-stage standalone (non-root, `node server.js`) → push registry → deploy; tag per-SHA (rollback). Env: `NEXT_PUBLIC_*` build-arg, secret server runtime.

## Konvensi — Monitoring

- `instrumentation.ts` (`register()`, `onRequestError`) + Sentry + source map.
- Uptime: `/api/health` (verifikasi dependency, bukan sekadar 200) + uptime eksternal.
- Log terstruktur (JSON, `correlationId`). Analytics cookieless (Plausible/Umami).
- Alert pada threshold error & tipe error baru.

## Konvensi — Forms (jika ada form waitlist/kontak)

- Server Action (`'use server'`), validasi **zod**.
- **Resend**: `contacts.create` ke Audience + konfirmasi via React Email (`@react-email/components`, properti `react`). Domain terverifikasi (SPF/DKIM/DMARC).
- **Anti-spam berlapis** (urut termurah): honeypot (silent drop, nama `website`) → time check (< 2 detik = bot) → rate limit per-IP (Upstash) → Turnstile invisible (opsional, server-verify).

## Konvensi — Privacy & i18n

- **Privacy**: pisahkan cookie-consent vs form-consent; checkbox consent **tidak pre-checked**; data minimization; privacy policy. Cookieless → kemungkinan tanpa banner; jika ada cookie non-esensial, blokir skrip **sebelum** consent. (Bukan nasihat hukum — verifikasi regulasi lokal/GDPR.)
- **i18n** (tunda sampai data membenarkan): `next-intl`, `[locale]` segment, `localePrefix: 'always'`, **`setRequestLocale` wajib** (jaga static), konten native per locale (jangan auto-translate), hreflang + `x-default`.

## Environment variables

```
NEXT_PUBLIC_SITE_URL=
APP_ENV=production                                          # untuk robots.ts env-aware
SANITY_PROJECT_ID= · SANITY_DATASET= · SANITY_API_TOKEN=    # token server-only
CMS_WEBHOOK_SECRET=                                         # server-only
RESEND_API_KEY= · RESEND_AUDIENCE_ID=                       # key server-only
RESEND_FROM=                                                # key server-only
SENTRY_DSN=                                                 # key server-only
SENTRY_ENVIRONMENT=production                               # key server-only
```

Validasi semua via `lib/env.ts` (zod, fail-fast saat build).

## NEVER (anti-pattern utama)

- ❌ `'use client'` di page/layout; fetch konten utama di `useEffect`; `force-dynamic` di landing page; cache tag global.
- ❌ Lebih dari satu `<h1>`; lupa canonical; JSON-LD tanpa escape `<`; static `robots.txt`.
- ❌ Gambar tanpa `sizes`/dimensi; lazy-load gambar LCP; font via `<link>`/`@import`; `revalidateTag` saja di belakang CDN generik.
- ❌ `<div onClick>`; menghapus focus indicator; form error lewat warna saja; animasi tanpa `prefers-reduced-motion`.
- ❌ Nonce CSP di situs static-first; `unsafe-eval` di produksi; andalkan `proxy.ts` untuk auth; secret server jadi build-arg; container root; deploy tanpa CI lulus.
- ❌ API key di client; domain email tak terverifikasi; honeypot kembalikan error; checkbox consent pre-checked; memuat analytics sebelum consent; auto-translate konten; lupa `setRequestLocale`.
- ❌ Secret tanpa validasi env; rate limit in-memory di multi-instance; lupa `cacheComponents: true`.

## Status implementasi (proyek ini)

Sudah selesai & DEPLOYED — jangan dirombak kecuali untuk menutup gap dari audit:
- ✅ Foundation (rendering static-first, CMS, content modeling)
- ✅ Discoverability (metadata, JSON-LD, sitemap/robots, SEO/GEO)
- ✅ Performance (CWV, image, font, caching, bundle, RUM)

Belum dikerjakan:
- ⬜ UX & Reliability — responsive, a11y, states, error pages
- ⬜ Quality & Ops — E2E, CI/CD, security headers, monitoring
- ⬜ Forms & Compliance — Resend, spam, privacy, i18n

Aturan: verifikasi tiap perubahan dengan `pnpm typecheck` + `pnpm build`. Kerjakan satu area per branch. Jangan sentuh kode di luar scope task aktif.