# AGENTS.md

Spesifikasi konvensi untuk **agen pengodean apa pun** (Claude Code, Cursor, Copilot, Codex, dll) saat membangun **landing page perusahaan** dengan Next.js 16. File ini adalah sumber kebenaran konvensi; ikuti seluruhnya. Bersifat umum — ganti placeholder sesuai proyekmu. (Claude Code membaca `CLAUDE.md`, yang isinya selaras dengan file ini.)

## Konfigurasi proyek (isi dulu)

| Item | Nilai |
|---|---|
| Nama produk | `Booqin` |
| Domain | `https://booqin.moonir.dev` → `NEXT_PUBLIC_SITE_URL` |
| CMS | Sanity (default) — Studio di **repo terpisah** |
| Email/form | Resend |
| Deploy | self-host (Docker standalone) |
| Bahasa | Indonesia, inggris |

## Setup & perintah

```bash
pnpm dev · pnpm build · pnpm start
pnpm lint        # Biome (next lint dihapus di Next 16)
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest + vitest-axe
pnpm test:e2e    # Playwright
```

Setelah tiap perubahan berarti: `pnpm typecheck` lalu `pnpm build` harus lulus. Definition of done satu fase = lint, typecheck, test, build semuanya hijau.

## Tech stack

- Next.js 16.2.x · App Router · Turbopack · `output: 'standalone'` · `cacheComponents: true`
- Node ≥ 20.9 (Node runtime, bukan edge) · React 19.2 + React Compiler
- TypeScript strict · Biome · Vitest · Playwright
- Sanity (Studio repo terpisah) · Resend + React Email · Tailwind v4

## Arsitektur — non-negotiable

1. **Static-first.** Prerender statis; JANGAN `force-dynamic` di landing page; bagian personal/live → dynamic hole via `<Suspense>`.
2. **Server Components default.** `'use client'` hanya di leaf interaktif terkecil (penyebab utama INP buruk & bloat JS).
3. **Konten CMS (Pola B):** `'use cache'` + `cacheLife('max')` + `cacheTag('page:<slug>')`; webhook → `revalidateTag(tag, 'max')`.
4. **Block-renderer:** array blok CMS → registry; blok tak dikenal di-skip.
5. **Satu sumber kebenaran:** query CMS hanya di `lib/cms/`; page & `generateMetadata` pakai query ber-cache yang sama.
6. `fetch` default `no-store` di Next 16 — opt-in cache eksplisit.

## Struktur folder

```
app/(marketing)/  · app/api/{revalidate,vitals,health}/ · app/actions/
app/layout.tsx (root: font, metadata, JSON-LD, <WebVitals/>)
app/{sitemap.ts,robots.ts,not-found.tsx,error.tsx,global-error.tsx}
components/{ui,sections}/ · components/block-renderer.tsx
lib/{cms,seo}/ · lib/{env,fonts,logger}.ts · instrumentation.ts · next.config.ts
```

## Konvensi per area

**Rendering & caching** — tag spesifik per halaman (jangan global); lima lapisan cache; CDN vs revalidation: Vercel purge otomatis, self-host + CDN generik → webhook harus purge CDN juga.

**SEO & AI search** — `metadataBase` + `title.template`; `viewport`/`themeColor` via export `viewport` terpisah; `generateMetadata` per halaman + canonical + toggle `noindex`; JSON-LD `Organization`+`WebSite` (`@graph`, escape `<` → `\u003c`); `sitemap.ts`+`robots.ts` dinamis & env-aware; tepat satu `<h1>`, HTML semantik; izinkan crawler AI answer; GEO: answer-first + `dateModified` akurat + `llms.txt` opsional.

**Performance** (P75: LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1) — RUM `<WebVitals/>` → `/api/vitals`; LCP: hero `priority`; INP: kurangi client JS, `useTransition`; CLS: dimensi gambar + `size-adjust` font; Image: `next-sanity/image` + selalu `sizes` + `quality` eksplisit + blur LQIP; Font: `next/font` module-level (subset, variable, CSS var); Bundle: `next/dynamic` + `optimizePackageImports` + `reactCompiler`, budget < 200KB di CI.

**UX & Reliability** — Responsive: mobile-first + `@container` + `clamp()` + `dvh`, touch ≥ 44px, tes Safari iOS; A11y (WCAG 2.2 AA): semantik dulu/ARIA terakhir, keyboard penuh, `:focus-visible` ≥ 3:1, skip link, form berlabel + error `aria-live`, kontras 4.5:1, `vitest-axe`; States: Suspense + skeleton (`motion-safe:`), empty state mengarahkan, error boundary + retry, `prefers-reduced-motion`; Error pages: `not-found.tsx` (Server), `error.tsx` (`'use client'`, `reset`, `digest`), `global-error.tsx` (html/body).

**Security** — CSP **statis** via `next.config` (BUKAN nonce — merusak static); HSTS env-aware + `frame-ancestors 'none'` + `nosniff` + `Referrer-Policy` + `Permissions-Policy`; rollout report-only; jangan andalkan `proxy.ts` untuk auth (verifikasi di data boundary); Server Action = endpoint publik (zod + otorisasi); patch hygiene; secret server-only, bukan build-arg.

**Testing & CI/CD** — E2E Playwright: `getByRole`, web-first assertion, alur kritis + `@axe-core/playwright`, `webServer` build+start, no hard wait; async Server Component diuji lewat E2E; CI gate `lint → typecheck → test → build → E2E → Lighthouse` + caching; CD: Docker standalone (non-root) → push registry → deploy, tag per-SHA; env build-time (`NEXT_PUBLIC_*` build-arg) vs runtime (secret).

**Monitoring** — `instrumentation.ts` (`register`, `onRequestError`) + Sentry + source map; uptime `/api/health` (cek dependency) + eksternal; log terstruktur (JSON + `correlationId`); analytics cookieless; alert pada threshold & tipe error baru.

**Forms** (jika ada) — Server Action (`'use server'`) + zod; Resend `contacts.create` ke Audience + konfirmasi React Email (properti `react`), domain terverifikasi (SPF/DKIM/DMARC); anti-spam berlapis: honeypot (silent drop, nama `website`) → time check (< 2s) → rate limit per-IP (Upstash) → Turnstile invisible (opsional, server-verify).

**Privacy & i18n** — pisahkan cookie-consent vs form-consent; checkbox consent tidak pre-checked; data minimization; cookieless → kemungkinan tanpa banner; jika ada cookie non-esensial, blokir skrip sebelum consent; privacy policy (bukan nasihat hukum). i18n (tunda): `next-intl` + `[locale]` + `localePrefix: 'always'` + **`setRequestLocale`** + konten native (jangan auto-translate) + hreflang/`x-default`.

## Environment variables

```
NEXT_PUBLIC_SITE_URL= · APP_ENV=production
SANITY_PROJECT_ID= · SANITY_DATASET= · SANITY_API_TOKEN=   # token server-only
CMS_WEBHOOK_SECRET= · RESEND_API_KEY= · RESEND_AUDIENCE_ID= # server-only
# opsional: UPSTASH_REDIS_REST_URL/TOKEN, TURNSTILE_SECRET_KEY (+ NEXT_PUBLIC_TURNSTILE_SITE_KEY)
```

Validasi via `lib/env.ts` (zod, fail-fast saat build).

## NEVER (anti-pattern utama)

- ❌ `'use client'` di page/layout; fetch konten utama di `useEffect`; `force-dynamic`; cache tag global.
- ❌ > satu `<h1>`; lupa canonical; JSON-LD tanpa escape `<`; static `robots.txt`.
- ❌ Gambar tanpa `sizes`/dimensi; lazy-load gambar LCP; font via `<link>`/`@import`; `revalidateTag` saja di belakang CDN generik.
- ❌ `<div onClick>`; hapus focus indicator; error form lewat warna saja; animasi tanpa `prefers-reduced-motion`.
- ❌ Nonce CSP di static-first; `unsafe-eval` produksi; `proxy.ts` untuk auth; secret jadi build-arg; container root; deploy tanpa CI lulus.
- ❌ API key di client; domain email tak terverifikasi; honeypot kembalikan error; consent pre-checked; analytics sebelum consent; auto-translate konten; lupa `setRequestLocale`.
- ❌ Secret tanpa validasi env; rate limit in-memory di multi-instance; lupa `cacheComponents: true`.

---

*Selaras dengan `CLAUDE.md` (Claude Code) & `BUILD_PLAN.md` (urutan kerja). Rujuk enam dokumen riset detail untuk kode lengkap & alasan tiap keputusan.*