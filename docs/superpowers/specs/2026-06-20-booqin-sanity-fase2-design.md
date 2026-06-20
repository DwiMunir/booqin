# Booqin Fase 2 — Sanity CMS (Credential-Ready) — Design Spec

> Disetujui 2026-06-20. Mode: **credential-ready** (belum ada kredensial Sanity; konten hardcode jadi fallback ber-type).
> Skema Studio disertakan sebagai **deliverable** di folder terpisah. Acuan: `AGENTS.md` (Pola B) + skill `sanity-best-practices`.

## Tujuan
Jadikan landing page digerakkan **block-renderer** dari sumber data ber-type (`PageBlock[]`), siap disambung Sanity. Tanpa kredensial: `getCachedPage` mengembalikan halaman hardcode (dibangun dari konten Fase 1). Dengan kredensial: jalur GROQ aktif tanpa ubah komponen.

## Keputusan arsitektur
- **Pola B (tag-based), bukan Live Content API.** `AGENTS.md` mewajibkan static-first + `'use cache'` + `cacheTag('page:<slug>')` + webhook `revalidateTag(tag,'max')`. (Skill default-nya `defineLive`; instruksi user menang.) Visual Editing/stega di luar scope.
- **Standalone Studio** (skema di repo/ folder terpisah), bukan embedded — sejalan AGENTS + best practices.
- **Objects, bukan references** untuk semua blok (konten unik per halaman).
- **Query CMS hanya di `lib/cms/`**; komponen murni prop-driven.
- **Blok tak dikenal di-skip** (return null), tidak crash.

## Modul (app-side)
| File | Isi |
|---|---|
| `lib/cms/types.ts` | union `PageBlock` (`hero`/`problem`/`aiSpotlight`/`howItWorks`/`features`/`socialProof`/`faq`/`cta`) discriminated by `_type`; `Page`, `Seo`, `SiteSettings`. Manual dulu → ganti TypeGen saat Studio asli ada. |
| `lib/cms/client.ts` | `createClient` (next-sanity, server, `useCdn`) + `isSanityConfigured()` (cek env). `null` bila belum dikonfigurasi. |
| `lib/cms/queries.ts` | `defineQuery` `PAGE_QUERY` + `SITE_SETTINGS_QUERY` (TypeGen-ready). |
| `lib/cms/get-page.ts` | `getCachedPage(slug)` & `getSiteSettings()`: `'use cache'` + `cacheLife('max')` + `cacheTag`. Tanpa creds → fallback hardcode; dengan creds → GROQ (fallback bila null). |
| `lib/content/home-page.ts` | bangun `Page` hardcode (blok `_type`/`_key`) dari `lib/content/landing.ts`. |
| `lib/content/site-settings.ts` | `SiteSettings` fallback (nav + footer) dari `landing.ts`. |
| `components/block-renderer.tsx` | switch ber-type → komponen section; key `_key`; unknown → null. |
| `app/api/revalidate/route.ts` | webhook: `parseBody` verifikasi `CMS_WEBHOOK_SECRET` → `revalidateTag('page:'+slug,'max')`. |

## Komponen
8 section + header/footer di-refactor jadi **prop-driven** (`Hero({ block })`, `SiteHeader({ nav })`, dst). Logika render identik; sumber data = props. FAQ JSON-LD tetap di section `faq` dari `block.items`. Gambar (hero + 3 foto proof) **tetap lokal** untuk pass ini.

## Halaman
- `app/(marketing)/layout.tsx` → `async`, `getSiteSettings()` → `<SiteHeader nav>` + `<SiteFooter footer>`.
- `app/(marketing)/page.tsx` → `async`, `getCachedPage('home')` → `<BlockRenderer blocks>`; `generateMetadata` dari `page.seo` (+ canonical `/`, toggle `noindex`).

## Studio schemas (deliverable, `sanity-studio-schemas/`)
`defineType` untuk: `page` (doc: title, slug, seo, pageBuilder), `siteSettings` (singleton), object `seo`, `pageBuilder` (array blok), tiap blok (hero/problem/aiSpotlight/howItWorks/features/socialProof/faq/cta), object reusable (iconCard, step, testimonial, faqItem, chatMessage, navLink), `index.ts`, `README.md` (cara pakai di Studio standalone: `npm create sanity`, CORS, env app, setup webhook). Heading level TIDAK disimpan di schema (di-set di frontend). socialProof photos dimodelkan `image[]` (LQIP) — wiring image app = follow-up.

## Testing
Contract test `block-renderer` (Vitest): render blok dikenal muncul; blok `_type` asing → skip (tidak render, tidak crash). Test lama tetap lulus (page smoke render via block-renderer).

## Scope ditunda (jujur)
- CMS-driven **image** (Sanity image + `urlFor` + LQIP) — follow-up; gambar masih lokal.
- **`[...slug]`** catch-all multi-halaman — `getCachedPage` sudah siap dipakai ulang.
- **Visual Editing / Presentation / stega** — konsekuensi Pola B.
- **TypeGen live** — pakai type manual sampai dataset asс ada.

## Gate
`pnpm typecheck && lint && test && build` harus lulus; smoke: build statis + `getCachedPage` fallback jalan (halaman tetap render identik).
