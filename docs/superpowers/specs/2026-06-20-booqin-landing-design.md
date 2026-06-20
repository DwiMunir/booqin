# Booqin Landing Page — Design Spec (Fase 0 + Fase 1)

> Status: disetujui 2026-06-20. Scope sesi ini: **Fase 0 (scaffold) + Fase 1 (10 section, konten hardcode)**.
> Sumber kebenaran arsitektur: `AGENTS.md` & `CLAUDE.md`. Sumber desain: `_landingpage/` (HTML bundle yang sudah diekstrak).

## Tujuan

Reproduksi setia landing page **Booqin** (AI booking assistant untuk pemilik venue) ke arsitektur Next.js 16 / App Router / Server-Components-default / Tailwind v4, dengan client island seminimal mungkin. Sanity (CMS) & Resend (form) **ditunda** ke Fase 2–3; konten di-hardcode di `lib/content/` dengan tipe yang meniru bentuk CMS agar migrasi Fase 2 mulus.

## Pendekatan

Translasi setia ke **Tailwind v4 + design tokens** (`@theme`), **satu komponen per section** (Server Component), client island hanya di leaf interaktif. Struktur folder persis `AGENTS.md` agar block-renderer CMS (Fase 2) tinggal masuk.

## Pemetaan Section → Sanity (Fase 2)

Halaman = `page` doc dengan array `pageBuilder` → block-renderer (registry; blok tak dikenal di-skip). Header/footer = **global** (`siteSettings` singleton), **bukan** blok pageBuilder.

| # | Section (komponen Fase 1)        | Fase 2 Sanity            | Jenis                         |
|---|----------------------------------|--------------------------|-------------------------------|
| — | `site-header` (Nav)              | `siteSettings` (global)  | chrome — **bukan** pageBuilder |
| 1 | `hero`                           | `heroBlock`              | **pageBuilder block**         |
| 2 | `problem`                        | `problemBlock`           | **pageBuilder block**         |
| 3 | `ai-spotlight`                   | `aiSpotlightBlock`       | **pageBuilder block**         |
| 4 | `how-it-works`                   | `howItWorksBlock`        | **pageBuilder block**         |
| 5 | `features`                       | `featuresBlock`          | **pageBuilder block**         |
| 6 | `social-proof`                   | `socialProofBlock`       | **pageBuilder block**         |
| 7 | `faq`                            | `faqBlock`               | **pageBuilder block**         |
| 8 | `final-cta`                      | `ctaBlock`               | **pageBuilder block**         |
| — | `site-footer`                    | `siteSettings` (global)  | chrome — **bukan** pageBuilder |

Tiap file section diberi komentar header yang menandai status Sanity-nya.

## Struktur folder (Fase 0+1)

```
app/
  layout.tsx          root html/body, fonts, metadata global + export viewport, JSON-LD Org+WebSite
  globals.css         @import "tailwindcss"; @theme tokens; base + keyframes
  (marketing)/
    layout.tsx        <SiteHeader/> + {children} + <SiteFooter/>
    page.tsx          komposisi 8 blok section (Server) + JSON-LD FAQPage
  not-found.tsx · error.tsx ('use client')
components/
  ui/        button.tsx, logo.tsx, icons.tsx (inline SVG)
  sections/  site-header, hero, problem, ai-spotlight, how-it-works,
             features, social-proof, faq, final-cta, site-footer
  client/    mobile-nav, ai-chat-demo, faq-accordion, whitelist-form, reveal  ('use client')
lib/
  env.ts (zod) · fonts.ts (next/font) · seo/ (jsonld, site config)
  content/   data ter-type: features, steps, faqs, testimonials, chatScript, capabilities, nav, footer
```

## Design tokens

Palet: teal `#0E4D47`/`#0A3A35`, accent `#15786E`, amber `#E0942E`/`#D2871F`/`#F2C079`, cream `#FAF7F1`, card `#FCFAF6`, ink `#11231F`/`#16211F`, muted `#4C5A56`/`#5C6A66`, tint `#EAF2F0`. Font: **Bricolage Grotesque** (display) + **Manrope** (sans) via `next/font` (self-host), variable, subset latin → CSS var → `@theme`.

## Client island & batas interaktivitas

- **MobileNav** — hamburger + drawer (`<820px`); nav desktop statis.
- **WhitelistForm** (`variant: 'hero' | 'cta'`) — email + submit, validasi regex client, success state. **Honeypot tersembunyi sekarang**; **consent + Server Action `useActionState` ditunda ke Fase 3** (desain belum menampilkan consent).
- **AiChatDemo** — chat animasi auto-play saat scroll masuk; kartu kapabilitas statis.
- **FaqAccordion** — buka/tutup; JSON-LD `FAQPage` di-emit server dari data yang sama.
- **Reveal** — wrapper IntersectionObserver kecil, dukung `delay`, hormati `prefers-reduced-motion`.

## SEO (Fase 1)

`metadataBase`, `title.template`, description+OG default; **`export const viewport` terpisah** (themeColor). Tepat **satu `<h1>`** (hero), sisanya `<h2>/<h3>`; landmark semantik. JSON-LD **Organization + WebSite** (`@graph`, escape `<`) + **FAQPage**. Canonical home statis. robots/sitemap dinamis, OG-image, WebVitals → **Fase 4**.

## Animasi & ikon

Keyframes `booqDot/booqPulse/booqIn` → `globals.css`. Ikon = inline SVG (`components/ui/icons.tsx`). Tak ada gambar raster di desain → `next/image` belum diperlukan di Fase 1.

## Testing (Fase 1)

Vitest + Testing Library + jsdom: validasi email, FaqAccordion buka/tutup, WhitelistForm (error/success), smoke test page (satu `<h1>` + landmark). Contract test block-renderer → Fase 2.

## Scaffold (Fase 0)

`next.config.ts`: `cacheComponents`, `typedRoutes`, `output:'standalone'`, blok `images` (AVIF/WebP, qualities, TTL 30 hari, `cdn.sanity.io`), `reactCompiler`. `tsconfig`: strict + `noUncheckedIndexedAccess` + `@/*`. **Biome** (bukan ESLint). `lib/env.ts`: var Sanity/Resend `.optional()` di Fase 1; `NEXT_PUBLIC_SITE_URL` wajib.

## Gate

Tiap perubahan berarti: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` harus lulus sebelum dianggap selesai.
