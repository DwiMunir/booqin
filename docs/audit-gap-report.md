# Laporan Gap Audit — Booqin

> Audit kode saat ini terhadap konvensi `CLAUDE.md` + `docs/research/` untuk 3 area yang belum dikerjakan: **UX & Reliability, Quality & Ops, Forms & Compliance**. Read-only — tidak ada perubahan kode. Tanggal: 2026-06-21.
> Legenda: ✅ ada · ⚠️ sebagian · ⬜ belum.

---

## Area 1 — UX & Reliability

### Sudah ada
- ✅ `not-found.tsx` (Server) + `error.tsx` (`'use client'` + `reset` + `console.error`).
- ✅ `prefers-reduced-motion` global di `globals.css`.
- ✅ Responsive: mobile-first + fluid `clamp()` (type/spacing/padding) menyebar; grid via `auto-fit`/flex-wrap.
- ✅ Ikon `aria-hidden`; kontras teks lulus (Lighthouse a11y 100).
- ✅ Form `useActionState` (idle/pending/success/error) + consent checkbox + honeypot + tombol pending.

### Kurang
- ⬜ **`global-error.tsx`** (pengaman root layout) — tak ada.
- ⬜ **Skip link** ("Lewati ke konten utama") + `<main tabIndex={-1}>` — tak ada.
- ⬜ **`:focus-visible` global** (ring ≥3:1) — tak ada; hanya input yang punya focus style; link/button andalkan default browser.
- ⬜ **Form error `role="alert"`/`aria-live`** — pesan error `<p>` tak diumumkan ke screen reader.
- ⬜ **Label email terasosiasi** — pakai `aria-label` (bukan `<label htmlFor>` visible).
- ⬜ **`not-found.tsx`**: tracking 404 + 404 lebih membantu (link ke section, bukan hanya "Back home").
- ⬜ **States data-driven** (`loading.tsx`/skeleton/empty/error per-section) — belum. *Catatan: halaman saat ini fully static (konten selalu ada) → prioritas rendah sampai ada bagian live/CMS-lambat.*
- ⬜ **`dvh`**, **container queries (`@container`)**, **`[...slug]` + `notFound()`** — belum (sebagian by-design single page).
- ⬜ Touch target hamburger 42px (<44px); fluid clamp belum jadi design token (`--text-h1` dll).

### Task (urut prioritas)
1. **Skip link + `:focus-visible` global + `<main id="main" tabIndex={-1}>`** (keyboard a11y, WCAG 2.2).
2. **Form a11y**: error `role="alert"`/`aria-live="polite"`; asosiasikan label email; honeypot `sr-only`.
3. **`global-error.tsx`** (html/body + inline style + reset).
4. **404 lebih membantu** + tracking (NotFoundTracker → analytics/vitals).
5. *(opsional)* `min-h-dvh` hero, container queries di block-renderer, `[...slug]` + `notFound()`, touch target 44px, tokenisasi clamp.
6. *(opsional, saat ada bagian live)* `loading.tsx` + skeleton + empty state.

---

## Area 2 — Quality & Ops (paling kosong)

### Sudah ada
- ✅ Gate lokal sebagian: `lint`/`typecheck`/`test`/`build` (Vitest, 17 tes).
- ✅ Docker multi-stage standalone non-root (`node server.js`) + `DEPLOY.md`.
- ✅ RUM: `<WebVitals/>` → `/api/vitals`.
- ✅ Server Action divalidasi zod (endpoint publik).

### Kurang
- ⬜ **Security headers** — `next.config.ts` **tak punya `headers()`**: tak ada CSP, HSTS, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. **(paparan keamanan live)**
- ⬜ **Monitoring**: `instrumentation.ts`, Sentry, `onRequestError`, source map — tak ada.
- ⬜ **`/api/health`** (verifikasi dependency) — tak ada.
- ⬜ **`lib/logger.ts`** (log JSON terstruktur, `correlationId`) — tak ada.
- ⬜ **E2E Playwright** (+ `@axe-core/playwright`, `test:e2e`) — tak ada (padahal async Server Component butuh E2E).
- ⬜ **CI/CD** (`.github/workflows` ci + deploy) — tak ada.
- ⬜ **`vitest-axe`** di unit test — tak ada.
- ⬜ **Analytics cookieless** (Plausible/Umami) — tak ada.

### Task (urut prioritas)
1. **Security headers di `next.config.ts`**: CSP statis (+`img-src cdn.sanity.io`), HSTS env-aware, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Rollout `CSP-Report-Only` dulu; verifikasi `curl -sI` + securityheaders.com.
2. **`/api/health`** (cek `getCachedPage('home')` → 200/503); arahkan uptime ke sana.
3. **Monitoring**: `instrumentation.ts` + Sentry (`register`/`onRequestError`) + source map; `lib/logger.ts` (pino); cocokkan `error.digest`.
4. **E2E Playwright**: alur kritis (hero/CMS, 404, submit waitlist dgn gate `process.env.E2E` di action) + `@axe-core/playwright`; tambah `vitest-axe` di unit.
5. **CI/CD GitHub Actions**: `ci.yml` (lint→typecheck→test→build→E2E→Lighthouse, caching deps+`.next`+Docker `type=gha`) + `deploy.yml` (build→GHCR tag per-SHA→SSH, environment protection, smoke test).
6. *(opsional)* analytics cookieless.

---

## Area 3 — Forms & Compliance

### Sudah ada
- ✅ Server Action `'use server'` + zod (email + consent wajib).
- ✅ `resend.contacts.create` ke Audience (live).
- ✅ **Honeypot** (`name="company"`, `aria-hidden`, `tabIndex=-1`, offscreen, silent → success).
- ✅ **Consent checkbox** wajib, **tidak pre-checked**; data minimization (email saja).

### Kurang
- ⬜ **Email konfirmasi (React Email)** — `emails.send` + template welcome; domain terverifikasi (SPF/DKIM/DMARC) di Resend.
- ⬜ **Time check** (submit <2 detik = bot) — tak ada.
- ⬜ **Rate limit per-IP** (Upstash, 429) — tak ada. *(penting: Server Action = endpoint publik; honeypot+consent saja belum cukup untuk POST langsung)*
- ⬜ **Privacy policy page** + **consent label menaut `/privacy`** — footer "Privacy" → `#`; label consent tanpa link. **(compliance gap nyata: mengumpulkan email + consent tapi tak ada kebijakan)**
- ⬜ Turnstile invisible (opsional).
- ⬜ **i18n** — *sengaja ditunda* (riset: tunggu ≥5% session non-anglophone 4 minggu). **Bukan gap — keputusan benar.**

### Task (urut prioritas)
1. **Privacy policy `/privacy`** + tautkan dari **consent label** & footer (ganti `#`). Isi: data (email; IP/timestamp anti-spam), tujuan, dasar hukum (consent), pihak ketiga (Resend), retensi, hak user (akses/hapus/unsubscribe), kontak. *(bukan nasihat hukum — verifikasi UU PDP/GDPR)*
2. **Email konfirmasi**: `@react-email/components` + template + `resend.emails.send({ react })` dari **domain terverifikasi**.
3. **Anti-spam lanjutan**: time check (hidden `ts`) + **rate limit per-IP** (Upstash) + log saat terpicu (pakai logger Area 2).
4. *(opsional)* Turnstile invisible (server-verify).
5. **i18n** — tunda sampai data membenarkan.

---

## Rekomendasi urutan lintas-area
1. **Security headers** (Area 2) — risiko keamanan live, cepat.
2. **Privacy policy + consent link** (Area 3) — compliance gap nyata, cepat.
3. **A11y dasar** (skip link, focus-visible, form aria-live, label) (Area 1) — WCAG 2.2, di titik konversi.
4. **`global-error.tsx` + `/api/health`** (Area 1+2) — pengaman reliability.
5. **Monitoring** (Sentry + logger + source map) (Area 2).
6. **Email konfirmasi + rate limit/time check** (Area 3).
7. **E2E + CI/CD** (Area 2) — cegah regresi ke depan.
8. Sisanya opsional: loading/skeleton, dvh/container queries, analytics, Turnstile, i18n.

> Cara kerja (per CLAUDE.md): satu area per branch; verifikasi `pnpm typecheck` + `pnpm build` tiap perubahan; jangan sentuh kode di luar scope task aktif.
