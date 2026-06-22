# Riset Quality & Ops Landing Page Perusahaan
### E2E Testing, CI/CD, Security, dan Monitoring dengan Next.js 16

*Dokumen riset internal · Disusun Juni 2026*

---

## Daftar Isi

0. [Ringkasan Eksekutif](#0-ringkasan-eksekutif)
1. [Konteks & Prinsip](#1-konteks--prinsip)
2. [E2E Testing (Playwright)](#2-e2e-testing-playwright)
3. [CI / CD Pipeline](#3-ci--cd-pipeline)
4. [Security & Headers](#4-security--headers)
5. [Monitoring & Analytics](#5-monitoring--analytics)
6. [Bagaimana Semuanya Terhubung](#6-bagaimana-semuanya-terhubung)
7. [Referensi](#7-referensi)

---

## 0. Ringkasan Eksekutif

Dokumen ini merangkum riset Quality & Ops untuk landing page perusahaan di Next.js 16, self-hosted — kelanjutan dari Foundation, Discoverability, Performance, dan UX & Reliability. Cakupannya empat pilar:

1. **E2E testing (Playwright)** — menguji alur kritis seperti dialami pengguna, termasuk async Server Component yang Vitest tak bisa.
2. **CI / CD pipeline** — gerbang CI lengkap (lint→typecheck→test→build→E2E→Lighthouse) + CD self-host (Docker standalone → registry → SSH).
3. **Security & headers** — CSP statis yang mempertahankan arsitektur static-first, header lengkap, dan hardening di luar header.
4. **Monitoring & analytics** — observability produksi: Sentry, uptime, log terstruktur, RUM, alert.

Tesis intinya: **kualitas ditegakkan otomatis sepanjang siklus — test → gerbang CI → hardening → deploy aman → observasi produksi → alert — sehingga regresi & insiden tertangkap sebelum user merasakannya.** Banyak fondasi sudah ada (gerbang CI dari Foundation, Lighthouse budget dari Performance, `vitest-axe` dari UX); kartu ini merangkainya jadi infrastruktur operasional utuh.

---

## 1. Konteks & Prinsip

Kelancaran development tidak menjamin visibilitas produksi. Quality & Ops menutup jarak antara "lulus di lokal" dan "andal di produksi" dengan otomasi: kualitas yang dijaga mesin, bukan kedisiplinan manual.

Dua prinsip yang memandu:

- **Tegakkan di gerbang, bukan harapan.** Setiap perubahan lewat gerbang otomatis (lint, type, test, E2E, performa, security) sebelum bisa di-merge & deploy.
- **Observasi sejak awal.** Pasang monitoring saat membangun, bukan setelah insiden pertama — terutama penting saat kode ditulis dengan bantuan agentic coding, yang cenderung menghasilkan kode fungsional tanpa observability bawaan.

Catatan irisan: gerbang CI memperluas yang dari Foundation; Lighthouse budget & RUM dari Performance; `vitest-axe` & a11y E2E dari UX; rate limiting form & consent analytics menyentuh Forms & Compliance.

---

## 2. E2E Testing (Playwright)

### 2.1 Di mana E2E duduk

E2E mengisi celah yang unit/integration test tak bisa: alur navigasi rusak, error hidrasi, kegagalan rendering yang bergantung jaringan, dan bug lintas browser. Playwright menjalankan Chromium, Firefox, & WebKit nyata secara paralel, auto-wait, dan menangkap screenshot/video/trace saat gagal. **Tie-in Foundation:** Vitest tak bisa menguji async Server Component — E2E me-render halaman sungguhan (termasuk konten CMS), jadi inilah lapisan yang memvalidasi alur CMS → block-renderer → HTML.

### 2.2 Setup & konfigurasi

```bash
npm init playwright@latest
npx playwright install
pnpm add -D @axe-core/playwright
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,        // retry hanya di CI
  workers: process.env.CI ? '50%' : undefined,
  reporter: [['html'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',         // non-negotiable di CI
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },  // Safari/iOS quirks
    { name: 'mobile', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',   // tes terhadap build nyata
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

### 2.3 Aturan locator & assertion (penghilang flake)

Pakai `getByRole` lebih dulu — direkomendasikan dokumentasi resmi dan sekaligus berfungsi sebagai cek a11y; jatuh ke `getByLabel`/`getByText`/`getByTestId` sebelum CSS/XPath. Beralih ke role-based locator menghilangkan lebih banyak tes flaky daripada perubahan lain. Pakai web-first assertion yang auto-retry; jangan hard wait (`waitForTimeout`).

### 2.4 Apa yang dites (critical journeys)

```ts
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('hero & konten CMS', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/booqin/i)).toBeVisible()   // async Server Component
  })

  test('404 untuk halaman tak ada', async ({ page }) => {
    const res = await page.goto('/halaman-tidak-ada')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: /tidak ditemukan/i })).toBeVisible()
  })
})
```

```ts
// e2e/waitlist.spec.ts
import { test, expect } from '@playwright/test'

test('submit waitlist sukses', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel(/saya setuju/i).check()
  await page.getByRole('button', { name: /join the waitlist/i }).click()
  await expect(page.getByRole('status')).toContainText(/berhasil/i)
})
```

> **Nuansa mocking:** `page.route()` hanya mencegat request sisi browser — panggilan Resend terjadi di Server Action (sisi server), jadi gerbang action dengan flag env (`if (process.env.E2E) return { ok: true }`) atau pakai audience Resend khusus tes. Jangan pukul layanan produksi dari tes.

### 2.5 Accessibility E2E

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage tanpa pelanggaran a11y otomatis', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

Tes otomatis mendeteksi sebagian masalah; banyak masalah a11y hanya ditemukan lewat tes manual — kombinasikan otomatis, manual, dan inclusive user testing.

### 2.6 Hindari — E2E

- ❌ Locator CSS/XPath rapuh alih-alih `getByRole`/`getByLabel`.
- ❌ Hard wait (`waitForTimeout`).
- ❌ Tes saling bergantung.
- ❌ Memukul layanan pihak ketiga nyata (Resend).
- ❌ Menutupi bug dengan retry.
- ❌ Secret di kode tes.
- ❌ Visual snapshot bergantung font di CI.

---

## 3. CI / CD Pipeline

### 3.1 CI vs CD

CI memvalidasi otomatis tiap perubahan (lint, test, build) sebelum merge, jalan di tiap PR; CD men-deploy kode tervalidasi ke environment, jalan saat merge ke main, bisa dengan approval manual untuk environment sensitif.

### 3.2 CI workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push: { branches: [main] }

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - uses: actions/cache@v4   # cache build Next.js
        with:
          path: ${{ github.workspace }}/.next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-${{ hashFiles('**/*.{ts,tsx}') }}
          restore-keys: ${{ runner.os }}-nextjs-${{ hashFiles('pnpm-lock.yaml') }}-

      - run: pnpm lint          # Biome
      - run: pnpm typecheck     # tsc --noEmit
      - run: pnpm test          # Vitest + vitest-axe
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium webkit
      - run: pnpm exec playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: playwright-report/ }
      - run: pnpm exec lhci autorun   # performance budget
```

Optimasi paling berdampak, berurutan: (1) dependency caching — mengurangi waktu job Node 60–80%; (2) Docker layer caching `type=gha`; (3) paralelisasi. Cache `.next/cache` mengikuti rekomendasi resmi Next.js (key dari hash lockfile + source).

### 3.3 Dockerfile — multi-stage standalone

`output: 'standalone'` menghasilkan `.next/standalone` berisi server Node + hanya dependensi terpakai (via tracing) → image lebih kecil.

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs   # non-root
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 3.4 CD workflow (self-host)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push: { branches: [main] }

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }} }
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}   # tag per-SHA (rollback)
          build-args: |
            NEXT_PUBLIC_SITE_URL=${{ vars.NEXT_PUBLIC_SITE_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-push
    runs-on: ubuntu-latest
    environment: production    # gerbang approval
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /srv/booqin
            docker compose pull
            docker compose up -d
            docker image prune -f
```

Alternatif lebih bersih: **Kamal 2.0** (zero-downtime deploy, SSL otomatis).

### 3.5 Build-time vs runtime env (jebakan)

- **`NEXT_PUBLIC_*`** di-bake saat build → kirim sebagai **build-args**.
- **Secret server** (`RESEND_API_KEY`, `SANITY_API_TOKEN`) jangan jadi build-arg (ter-bake ke image) → berikan saat **runtime** lewat `docker compose` env.

### 3.6 Rollback & smoke test

Karena image di-tag per `github.sha`, rollback = deploy ulang tag SHA sebelumnya. Tambahkan smoke test pasca-deploy (curl health + cek 200) sebelum menandai sukses.

### 3.7 Hindari — CI/CD

- ❌ Tanpa caching (deps, `.next`, Docker layer).
- ❌ Secret server sebagai build-arg.
- ❌ Deploy tanpa CI lulus.
- ❌ Tanpa environment protection produksi.
- ❌ Tag image `latest` saja (sulit rollback).
- ❌ Container jalan sebagai root.
- ❌ Tanpa smoke test pasca-deploy.

---

## 4. Security & Headers

### 4.1 Keputusan krusial: CSP statis vs nonce

CSP nonce paling ketat, tapi mengharuskan rendering dinamis — yang menonaktifkan static optimization, ISR, PPR, dan caching CDN. Ini menghancurkan arsitektur static-first kita. **Keputusan: CSP statis via `next.config` headers** (korbankan sedikit ketat demi mempertahankan static + CDN + LCP). Kalau kelak butuh CSP ketat tanpa kehilangan statis, opsinya SRI eksperimental (App Router-only, menjaga static generation utuh) — bukan nonce.

### 4.2 Set header lewat `next.config.ts`

```ts
// next.config.ts
import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`, // unsafe-eval dev-only
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://cdn.sanity.io",
  "font-src 'self'",
  "connect-src 'self' https://cdn.sanity.io",
  "frame-ancestors 'none'",   // anti-clickjacking (lebih baik dari X-Frame-Options)
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-Frame-Options', value: 'DENY' }, // fallback legacy
  ...(isDev ? [] : [{   // HSTS hanya produksi (jangan di localhost http)
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  }]),
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}
export default nextConfig
```

`frame-ancestors` lebih utama dari `X-Frame-Options`; HSTS env-aware (jangan di localhost http); `unsafe-eval` hanya dev (HMR React, tak dipakai produksi).

### 4.3 Self-host & rollout

Karena self-host, header bisa di-set di nginx (pilih satu tempat agar tak konflik). Luncurkan CSP bertahap dengan `Content-Security-Policy-Report-Only` + `report-uri` dulu, amati pelanggaran, baru tegakkan.

### 4.4 Di luar header

- **Jangan andalkan `proxy.ts` untuk otorisasi** — beberapa CVE (CVE-2025-29927; bypass segment-prefetch di 16.2.6) membuatnya bisa dilewati; verifikasi auth di data boundary, pakai proxy hanya untuk routing/header/nonce.
- **Patch hygiene** — Next 16.0.4 menambal RCE (CVSS 10.0); jaga dependensi terbaru (npm audit/Dependabot di CI).
- **Server Action = endpoint publik** — validasi input (zod) & otorisasi; form whitelist sudah menerapkannya.
- **CSRF nyata** = SameSite/double-submit cookie, bukan header `X-CSRF-Token` palsu (Server Actions punya cek origin bawaan).
- **Tes header** — `curl -sI` ke produksi, preview, & CDN front door; cek securityheaders.com.

### 4.5 Hindari — security

- ❌ Nonce CSP di situs static-first.
- ❌ `unsafe-eval` di produksi.
- ❌ HSTS di localhost http.
- ❌ Mengandalkan `proxy.ts`/middleware untuk auth.
- ❌ Wildcard `*` di CSP.
- ❌ Header di dua tempat yang konflik.
- ❌ Dependensi usang.

---

## 5. Monitoring & Analytics

### 5.1 Celah visibilitas produksi

Kelancaran dev tidak menjamin visibilitas produksi — insiden khasnya: log server hanya "Internal Server Error", lokal lulus, user bilang hang, tak bisa reproduce (ternyata timeout SDK pihak ketiga). Empat pilar: error tracking, structured logging, performance/RUM, alert. **Tie-in agentic coding:** AI agent menulis kode fungsional tanpa observability bawaan (mis. query N+1 tak terlihat di dev 40 baris, lambat di prod 400 baris) — instrumentasi sejak awal.

### 5.2 `instrumentation.ts` — titik inisialisasi

File di root yang `register()`-nya dipanggil sekali saat server boot, sebelum request — tempat tepat init SDK monitoring (Sentry, OTel).

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}

export async function onRequestError(err: unknown, request: Request, context: unknown) {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err as Error, request, context as never)
}
```

### 5.3 Error tracking: Sentry

Setiap app produksi butuh error tracking; Sentry default. Setup `npx @sentry/wizard@latest -i nextjs` (membuat config + webpack plugin + source map). Hook `onRequestError`, stack trace terbaik, konteks runtime. Pasangkan `error.digest` (UX #4) untuk mencocokkan error klien dengan log server. Gratis 5.000 error/bulan, Team $26/bulan.

**Batas jujur:** kalau server tak terjangkau / DNS salah / deploy rusak / DB hang tanpa melempar — Sentry tak menangkap apa pun; performa sample-based (~10%); tak ada uptime native. Maka butuh lapisan kedua.

### 5.4 Uptime — eksternal + internal

External (UptimeRobot gratis 50 monitor) punya batas "200 OK tapi rusak" (route bisa balas 200 sambil memproses 3 detik). Pasangkan health check internal yang verifikasi dependency:

```ts
// app/api/health/route.ts
import { getCachedPage } from '@/lib/cms/queries'

export async function GET() {
  try {
    await getCachedPage('home')          // CMS terjangkau?
    return Response.json({ status: 'ok' }, { status: 200 })
  } catch {
    return Response.json({ status: 'degraded' }, { status: 503 })
  }
}
```

Arahkan uptime ke `/api/health`, bukan `/`.

### 5.5 Structured logging

JSON dengan `correlationId`, metadata (timestamp, requestId, env), agregasi terpusat, log level. Log server langsung ke aggregator; log klien dikirim via backend dulu.

```ts
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty' } }),
})
```

Alur debug: Sentry → `correlationId` → log → metrik performa → reproduce di staging. Aktifkan source map untuk stack trace produksi.

### 5.6 RUM, OTel, & analytics privacy-friendly

- **RUM** sudah dibangun di Performance #6 (`useReportWebVitals` → `/api/vitals`) — pastikan `<WebVitals/>` terpasang.
- **OpenTelemetry** (`@vercel/otel`) — standar vendor-neutral, menghindari lock-in; untuk self-host bisa ke Grafana/SigNoz. Verbose; biasanya berlebihan untuk landing page.
- **Product analytics privacy-friendly** — Plausible/Umami: cookieless, self-hostable, tak mengumpulkan PII (sering tak butuh cookie banner). Cocok dengan posisi self-host. Detail consent/GDPR ada di kartu Forms & Compliance.

### 5.7 Alerting & stack lean

Notifikasi saat error rate melebihi threshold, push Slack untuk tipe error baru pada kemunculan pertama, alert regresi performa. Stack lean self-host: **Sentry** (error) + **UptimeRobot + `/api/health`** (uptime) + **Pino → aggregator** (log) + **RUM** (Web Vitals). Naik ke Datadog/OTel penuh hanya saat skala menuntut.

### 5.8 Hindari — monitoring

- ❌ Memasang monitoring belakangan.
- ❌ Mengandalkan Sentry saja (tak tangkap server-down).
- ❌ Uptime ke `/` saja ("200 tapi rusak" lolos).
- ❌ Log tak terstruktur/tercecer.
- ❌ Tanpa source map di produksi.
- ❌ Log klien langsung ke aggregator.
- ❌ Monitoring tanpa alert.
- ❌ Analytics melanggar privasi tanpa consent.

---

## 6. Bagaimana Semuanya Terhubung

Empat pilar Quality & Ops bukan daftar terpisah — semuanya tahap dalam satu siklus kualitas yang ditegakkan otomatis, dari kode sampai produksi yang terpantau:

```
1. Tulis kode + test — Vitest (unit) + Playwright (E2E, termasuk async Server Component)
        ↓
2. Push → gerbang CI — lint → typecheck → test → build → E2E → Lighthouse budget
        ↓
3. Harden — CSP statis + header lengkap, patch dependensi, validasi di data boundary
        ↓
4. Merge → CD — build Docker standalone → push GHCR → deploy SSH (rollback per-SHA)
        ↓
5. Observasi produksi — Sentry (error) + /api/health (uptime) + log terstruktur + RUM
        ↓
6. Alert → perbaiki → ulangi — Slack saat threshold & tipe error baru terlampaui
```

Pemetaan tahap → alat:

| Tahap | Alat/teknik | Bab |
|---|---|---|
| **Test sebelum merge** | Playwright E2E + Vitest + vitest-axe | #2 |
| **Gerbang & deploy otomatis** | GitHub Actions CI + Docker standalone + SSH CD | #3 |
| **Hardening** | CSP statis, HSTS/frame-ancestors, patch, auth di data boundary | #4 |
| **Observasi produksi** | Sentry, /api/health, log terstruktur, RUM, alert | #5 |

Benang merahnya: tiap tahap menahan satu kelas masalah agar tak sampai ke user. Test menangkap regresi fungsional; gerbang CI memblokir kode buruk sebelum merge; hardening menutup celah keamanan; CD membuat rilis aman & dapat di-rollback; monitoring menangkap apa yang lolos ke produksi. Karena semuanya otomatis dan dibangun di atas arsitektur kartu sebelumnya, kualitas jadi properti yang dijaga mesin — bukan kedisiplinan manual yang rapuh.

---

## 7. Referensi

Fakta versi, API, dan data diverifikasi terhadap dokumentasi resmi dan sumber industri (Juni 2026):

- Dokumentasi resmi Next.js — CI Build Caching, Deploying (Docker standalone), Content Security Policy, instrumentation.
- Dokumentasi Playwright — Accessibility testing, best practices; panduan E2E 2026 (TestDino, Qaskills, Autonoma, ECOSIRE).
- Panduan CI/CD & Docker self-host (tech-insider, Medium/Juwono, DEV Community, Dallotech, getdeploying/Kamal).
- Panduan security Next.js 16 (LogRocket, TurboStarter, makerkit, Medium, techbytes) — CSP nonce vs statis, advisory CVE.
- Panduan monitoring (Nurbak, Sentry, BetterLink, SigNoz, Prateeksha) — instrumentation.ts, Sentry, uptime, structured logging, OTel.

*Detail data, versi, dan kebijakan dapat berubah; verifikasi ulang sebelum keputusan final.*
