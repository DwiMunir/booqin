# BUILD PLAN — Landing Page (Target: live sebelum Senin)

> Rencana eksekusi akhir pekan. Stack & aturan ada di `AGENTS.md`. Tandai ✅ saat selesai.
> Prioritas: **[P0]** wajib untuk demo · **[P1]** penting · **[P2]** kalau sempat / sesudah deploy.

## Cara pakai dengan agent (Claude Code)

1. Taruh `AGENTS.md` di root repo. Agent akan membacanya tiap task.
2. Kerjakan **per fase**, bukan sekaligus — minta agent menyelesaikan & memverifikasi satu fase sebelum lanjut.
3. Kalimat pembuka yang bisa kamu pakai:
   > "Baca AGENTS.md. Kita bangun landing page perusahaan sesuai itu. Mulai Fase 0 di BUILD_PLAN: scaffold proyek + konfigurasi. Jangan lanjut ke fase berikutnya sebelum `pnpm build` & `pnpm typecheck` lulus."

---

## Fase 0 — Scaffold & konfigurasi [P0]

- [ ] `create-next-app` (TypeScript, App Router, Biome, src opsional, import alias `@/*`, sertakan `AGENTS.md`)
- [ ] `next.config.ts`: `cacheComponents: true`, `typedRoutes: true`, `output: 'standalone'`, blok `images` (AVIF/WebP, qualities, minimumCacheTTL 30 hari, remotePatterns `cdn.sanity.io`), `experimental.optimizePackageImports` + `reactCompiler`
- [ ] `tsconfig`: strict + `noUncheckedIndexedAccess`
- [ ] `lib/env.ts` (zod) — `SANITY_*`, `CMS_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`
- [ ] `lib/fonts.ts` (`next/font`, subset latin, variable, CSS var)
- [ ] Root `layout.tsx`: html/body + font + metadata global + `viewport` export
- [ ] Verifikasi: `pnpm build` lulus

## Fase 1 — Landing page inti (bisa berdiri sendiri dulu) [P0]

- [ ] Route group `(marketing)/layout.tsx` (header/nav + footer semantik)
- [ ] Sections: `Hero` (satu-satunya `<h1>`), `Features`, `Cta`, `Footer` — konten hardcode sementara
- [ ] `components/ui/` primitif (Button) — client island hanya yang interaktif
- [ ] Responsif mobile (utamakan mobile-first) + a11y dasar (landmark, alt, focus state)
- [ ] `not-found.tsx` (404) + `error.tsx`
- [ ] **Checkpoint:** halaman tampil rapi di mobile & desktop, build lulus → ini sudah bisa di-deploy kalau waktu mepet

## Fase 2 — Sanity (Studio repo terpisah) [P1]

- [ ] Repo Studio terpisah: schema `page` (array `pageBuilder`), blok `heroBlock`/`featuresBlock`/`ctaBlock`, object `seo`, image dengan LQIP
- [ ] Di app: `lib/cms/` client + `getCachedPage` (`'use cache'` + `cacheTag('page:<slug>')`) + TypeGen
- [ ] `block-renderer.tsx` (registry, skip blok tak dikenal) — sambungkan sections ke data CMS
- [ ] `app/api/revalidate/route.ts` (verifikasi secret → `revalidateTag('page:<slug>', 'max')`)
- [ ] Webhook publish di Sanity → endpoint revalidate
- [ ] Test kontrak `block-renderer` (Vitest)

## Fase 3 — Form whitelist → Resend [P1]

- [ ] `app/actions/join-whitelist.ts` (Server Action, zod, honeypot, consent, `resend.contacts.create`)
- [ ] `components/sections/whitelist-form.tsx` (`useActionState`, state pending/sukses/gagal)
- [ ] Buat Audience di Resend, set `RESEND_AUDIENCE_ID`
- [ ] (P2) email konfirmasi via `resend.emails.send` + React Email
- [ ] (P2) rate limiting per-IP (Upstash Redis) — honeypot+consent cukup untuk MVP

## Fase 4 — SEO & performa polish [P1]

- [ ] `generateMetadata` per halaman dari CMS + **canonical** + OG + toggle `noindex`
- [ ] `opengraph-image.tsx` (dinamis)
- [ ] JSON-LD `Organization` + `WebSite` (`@graph`, escape `<`) di root
- [ ] `sitemap.ts` & `robots.ts` dinamis (robots env-aware, izinkan crawler AI answer)
- [ ] Gambar: `next-sanity/image` + `sizes` + hero `priority`
- [ ] `<WebVitals/>` (`useReportWebVitals`) → `/api/vitals`
- [ ] Jalankan Lighthouse (target LCP<2.5s, CLS<0.1) + cek bundle

## Fase 5 — Self-host deploy [P0]

- [ ] Build standalone (`output: 'standalone'`) → Dockerfile, atau PaaS self-host (Railway / Render / Fly / Coolify / VPS+nginx)
- [ ] Set env produksi (Sanity, Resend, webhook secret, `VERCEL_ENV`-equivalent untuk env-aware robots → pakai env sendiri mis. `APP_ENV=production`)
- [ ] Domain + HTTPS
- [ ] Daftarkan URL webhook revalidate di Sanity (pakai domain produksi)
- [ ] Jika ada CDN di depan: tambah purge CDN di webhook
- [ ] **Smoke test:** halaman live, form whitelist masuk ke audience Resend, edit di Sanity → publish → halaman ter-update

---

## Scope MVP (kalau waktu menipis, prioritaskan ini)

**Harus ada:** Fase 0, Fase 1, Fase 5 (deploy) + dari Fase 4: metadata+canonical, satu `<h1>`/semantik, `next/image`+`next/font`, 404. Form (Fase 3) kalau sempat; kalau tidak, ganti dulu dengan tombol CTA dan tambahkan setelah deploy.

**Boleh ditunda:** Sanity (Fase 2) bisa pakai konten hardcode dulu lalu disambung; email konfirmasi; rate limiting; OG image dinamis; RUM.

## Yang sengaja BELUM diriset (sampaikan ke atasan sebagai "next")

- **UX & Reliability** (a11y mendalam, empty/loading states lengkap, cross-browser)
- **Quality & Ops** (E2E Playwright, CI/CD penuh, monitoring, security headers)
- **Forms & Compliance** (privacy/cookie consent menyeluruh, i18n) — form whitelist saat ini menerapkan irisan minimalnya (consent + anti-spam)

## Checklist laporan Senin

- [ ] URL landing page yang live
- [ ] Tiga PDF riset (Foundation, Discoverability, Performance) sebagai dasar keputusan
- [ ] Ringkasan: keputusan arsitektur utama + apa yang sudah terbukti jalan (deploy, CMS edit→publish, form→Resend)
- [ ] Daftar "next steps" (tiga kartu sisa) sebagai rencana lanjutan
