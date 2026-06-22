# Riset UX & Reliability Landing Page Perusahaan
### Responsive, Accessibility, dan Ketangguhan UI dengan Next.js 16

*Dokumen riset internal · Disusun Juni 2026*

---

## Daftar Isi

0. [Ringkasan Eksekutif](#0-ringkasan-eksekutif)
1. [Konteks & Prinsip](#1-konteks--prinsip)
2. [Responsive & Cross-Browser](#2-responsive--cross-browser)
3. [Accessibility (a11y)](#3-accessibility-a11y)
4. [Loading, Empty & Error States](#4-loading-empty--error-states)
5. [404 / 500 & Error Boundaries](#5-404--500--error-boundaries)
6. [Bagaimana Semuanya Terhubung](#6-bagaimana-semuanya-terhubung)
7. [Referensi](#7-referensi)

---

## 0. Ringkasan Eksekutif

Dokumen ini merangkum riset UX & Reliability untuk landing page perusahaan di Next.js 16 — kelanjutan dari riset Foundation, Discoverability, dan Performance. Cakupannya empat pilar:

1. **Responsive & cross-browser** — mobile-first + container queries + fluid `clamp()` + viewport units modern (`dvh`), dengan tes perangkat nyata.
2. **Accessibility (a11y)** — WCAG 2.2 AA: semantik dulu, keyboard penuh, focus-visible, form & menu accessible, tes berlapis.
3. **Loading, empty & error states** — matriks state deklaratif: Suspense + skeleton, empty state yang mengarahkan, error boundary dengan retry.
4. **404 / 500 & error boundaries** — `not-found.tsx`, `error.tsx`, `global-error.tsx` dengan jalan pulih dan tracking.

Tesis intinya: **UI yang tangguh menangani setiap kondisi — semua perangkat, semua input, semua state data, semua kegagalan — dengan degradasi yang anggun dan jalan pulih yang jelas.** Banyak fondasi sudah ada (HTML semantik = AI-readable dari Discoverability, client islands dari Foundation, `prefers-reduced-motion` ↔ INP dari Performance); kartu ini menambahkan lapisan ketangguhan & inklusivitas di atasnya.

---

## 1. Konteks & Prinsip

Reliability di sini berarti **graceful degradation** di empat dimensi: perangkat, input, state data, dan kegagalan. Bukan sekadar "tampil bagus di laptop developer", tapi tetap berfungsi di Galaxy Fold, dengan keyboard saja, saat data masih loading, dan saat server error.

Dua prinsip yang memandu:

- **Tangani setiap kondisi, bukan happy-path saja.** Setiap UI data-driven punya state loading/sukses/empty/error; setiap interaksi harus bisa keyboard; setiap perangkat harus terlayani.
- **Degradasi anggun + jalan pulih.** Saat sesuatu gagal, user tidak menemui jalan buntu — selalu ada retry, link kembali, atau fallback yang jelas.

Catatan irisan: responsive memengaruhi Core Web Vitals (Performance), HTML semantik beririsan dengan SEO/AI-readability (Discoverability), dan `prefers-reduced-motion` menyentuh INP. Disinggung seperlunya tanpa mengulang.

---

## 2. Responsive & Cross-Browser

### 2.1 Model 2026: berlapis, bukan breakpoint untuk segalanya

Responsive modern memakai tiga tuas untuk level berbeda: **media query** untuk layout halaman, **container query** untuk komponen, dan **`clamp()`** untuk type & spacing yang mengalir. Perlakukan responsiveness sebagai urusan design system — bangun komponen yang responsive by default.

### 2.2 Mobile-first

Mulai dengan style layar terkecil, lalu `min-width` untuk menambah ke atas (CSS lebih ramping, memaksa prioritas konten). Di Tailwind, base = mobile, `md:`/`lg:` menambah:

```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
  {features.map((f) => <FeatureCard key={f.id} {...f} />)}
</div>
```

### 2.3 Fluid typography & spacing dengan `clamp()`

Ganti loncatan font-size antar breakpoint dengan skala mulus. Definisikan sebagai design token:

```css
/* globals.css */
@theme {
  --text-h1: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);     /* 32 → 56px */
  --text-h2: clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem); /* 24 → 36px */
  --spacing-section: clamp(3rem, 2rem + 4vw, 8rem);   /* 48 → 128px */
}
```

Terapkan fluid ke heading/hero/section title; pertahankan body text 16–18px (keterbacaan utama), line-height ~1.5–1.6 body / ~1.2 heading. Selalu uji di 320px dan 2560px. Fluid spacing menghilangkan puluhan override per-breakpoint.

### 2.4 Container queries — komponen yang benar-benar reusable

Container query (baseline 2023, dukungan 90%+, semua browser utama) membuat komponen merespons ukuran parent, bukan viewport — sempurna untuk block-renderer. Di Tailwind v4:

```tsx
<div className="@container">
  <article className="flex flex-col gap-4 @md:flex-row @md:items-center">
    <img className="w-full @md:w-1/3" ... />
    <div>...</div>
  </article>
</div>
```

Blok ini jadi satu kolom saat sempit (sidebar) dan dua kolom saat lebar (full-width), tanpa peduli viewport.

### 2.5 Viewport units modern — `dvh`

`100vh` menyembunyikan konten di balik address bar mobile. Pakai `dvh` (dynamic viewport height) untuk hero/modal; `svh`/`lvh` untuk viewport terkecil/terbesar:

```tsx
<section className="min-h-dvh flex items-center">...</section>
```

### 2.6 Unit relatif & touch target

Pakai `rem`/`%`/`dvh` (hormati zoom & font global — irisan a11y). Target interaktif minimal ~44px:

```css
button, a[role="button"] { min-block-size: 44px; min-inline-size: 44px; }
```

### 2.7 Cross-browser — realita & tes

"Modern browser" bukan gambaran utuh: WebView app native & browser regional berbeda, dan ada perbedaan rendering halus (flexbox di Safari, Grid di Firefox/Edge). Strategi: DevTools responsive mode untuk cek cepat, tapi tes di **minimal satu ponsel & satu tablet nyata** (emulator tak menangkap masalah sentuh & rendering nyata); BrowserStack untuk matriks perangkat. Untuk landing page: minimal Chrome + Safari iOS + satu Android nyata (Safari iOS paling sering jadi sumber kejutan).

### 2.8 Hindari — responsive

- ❌ `vw` untuk font tanpa `clamp()` minimum.
- ❌ Hamburger menu di desktop saat ruang cukup.
- ❌ Breakpoint media query untuk segala hal (pakai container query + clamp).
- ❌ `100vh` untuk hero/modal (pakai `dvh`).
- ❌ Pixel mutlak untuk type & spacing.
- ❌ Tes hanya di DevTools (wajib perangkat nyata, Safari iOS).
- ❌ Touch target < 44px.

---

## 3. Accessibility (a11y)

### 3.1 Model: WCAG 2.2 AA & POUR

Target WCAG 2.2 Level AA. Kerangka POUR: Perceivable, Operable, Understandable, Robust. Melanggar salah satunya = tidak accessible. A11y beririsan dengan SEO/AI (HTML semantik = AI-readable).

### 3.2 Aturan #1: semantic HTML dulu, ARIA terakhir

Jangan pakai ARIA kalau bisa pakai HTML semantik — ARIA upaya terakhir, hanya untuk komponen kustom tanpa padanan native. Kegagalan klasik:

```tsx
// ❌ tidak bisa diakses keyboard
<div onClick={handleClick}>Klik</div>
// ✅ semantik + keyboard otomatis
<button onClick={handleClick}>Klik</button>
```

### 3.3 Keyboard & focus-visible

Semua interaktif harus terjangkau Tab dengan urutan logis; mouse-only = kegagalan. Tes: cabut mouse, Tab/Shift+Tab/Enter. Jangan hapus focus indicator — desain yang lebih baik (WCAG 2.2: kontras ≥ 3:1):

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 3.4 Skip link

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-3">
  Lewati ke konten utama
</a>
<main id="main" tabIndex={-1}>{children}</main>
```

### 3.5 Form waitlist yang accessible

Setiap input butuh label (for/id); grup pakai fieldset+legend; error via aria-describedby + diumumkan ke AT (bukan warna saja):

```tsx
'use client'
import { useActionState } from 'react'
import { joinWhitelist } from '@/app/actions/join-whitelist'

export function WhitelistForm() {
  const [state, action, pending] = useActionState(joinWhitelist, null)
  return (
    <form action={action} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email"
        aria-invalid={state?.error === 'invalid' || undefined}
        aria-describedby="email-status" />

      {/* honeypot disembunyikan dari AT */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />

      <div>
        <input id="consent" name="consent" type="checkbox" required />
        <label htmlFor="consent">Saya setuju menerima email tentang Booqin.</label>
      </div>

      <button type="submit" disabled={pending}>
        {pending ? 'Mengirim…' : 'Join the waitlist'}
      </button>

      <p id="email-status" role="status" aria-live="polite">
        {state?.error === 'invalid' && 'Masukkan email yang valid.'}
        {state?.ok && 'Berhasil! Cek email konfirmasimu.'}
      </p>
    </form>
  )
}
```

### 3.6 Menu mobile (disclosure)

```tsx
'use client'
import { useState } from 'react'

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
        <span className="sr-only">{open ? 'Tutup menu' : 'Buka menu'}</span>
        <MenuIcon aria-hidden="true" />
      </button>
      <nav id="mobile-nav" aria-label="Menu mobile" hidden={!open}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
        {/* links */}
      </nav>
    </>
  )
}
```

### 3.7 Fokus saat navigasi klien

Client navigation App Router perlu manajemen fokus eksplisit — pindahkan fokus ke main setelah pindah halaman:

```tsx
'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RouteFocus() {
  const pathname = usePathname()
  useEffect(() => { document.getElementById('main')?.focus() }, [pathname])
  return null
}
```

### 3.8 Ikon, link, kontras, & widget kompleks

Tombol ikon-saja butuh `aria-label` + ikon `aria-hidden`. Link deskriptif (bukan "klik di sini"). Kontras teks normal ≥ 4.5:1, besar ≥ 3:1; jangan andalkan warna saja. Untuk modal/dropdown/tabs: pakai `<dialog>` native (`.showModal()` memberi focus trap, Escape, ARIA bawaan) atau library accessible (Radix/React Aria), jangan bangun dari nol.

### 3.9 Tes berlapis

1. **Dev-time** — aturan a11y Biome.
2. **Otomatis** — axe DevTools / `vitest-axe` (hanya menangkap sebagian).
3. **Manual keyboard** — cabut mouse.
4. **Screen reader** — NVDA (Windows) / VoiceOver (macOS).

"Shift left" — masukkan `vitest-axe` ke gerbang CI Foundation.

```ts
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'

it('tanpa pelanggaran a11y', async () => {
  const { container } = render(<WhitelistForm />)
  expect(await axe(container)).toHaveNoViolations()
})
```

### 3.10 Hindari — a11y

- ❌ `<div onClick>` pengganti button/link.
- ❌ Menghapus focus indicator.
- ❌ ARIA berlebihan untuk elemen semantik native.
- ❌ Form error lewat warna saja.
- ❌ Input tanpa label; tombol ikon tanpa `aria-label`.
- ❌ Mengandalkan tes otomatis saja.
- ❌ Membangun modal/dropdown dari nol.

---

## 4. Loading, Empty & Error States

### 4.1 Model: matriks state deklaratif

Setiap UI data-driven punya empat state: loading, sukses, empty, error. Berhenti pakai `if (isLoading)`/`if (error)` manual — Suspense menangani "menunggu", Error Boundary menangkap "rusak".

### 4.2 Loading: `loading.tsx` + Suspense + skeleton

`loading.tsx` otomatis membungkus page dalam Suspense, menampilkan loading instan dari server sementara konten di-stream, lalu di-swap saat selesai (fallback di-prefetch → navigasi instan & dapat diinterupsi). Untuk kontrol halus, stream bagian per bagian:

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Hero />
      <Features />
      <Suspense fallback={<TestimonialsSkeleton />}>
        <Testimonials />
      </Suspense>
    </>
  )
}
```

> Cache Components: akses data uncached/runtime di layout harus dibungkus `<Suspense>` eksplisit, jika tidak error saat build.

### 4.3 Skeleton > spinner

Skeleton memberi tahu layout (3 bar = 3 artikel), mengurangi kepanikan; 3–5 item cukup. Ikuti bentuk konten asli, animasi hormati `prefers-reduced-motion`:

```tsx
export function FeatureSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-6">
          <div className="h-10 w-10 rounded-full bg-slate-200 motion-safe:animate-pulse" />
          <div className="mt-4 h-5 w-2/3 rounded bg-slate-200 motion-safe:animate-pulse" />
          <div className="mt-2 h-4 w-full rounded bg-slate-200 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}
```

### 4.4 Empty state — jangan jadi jalan buntu

Saat data nol item, jelaskan kenapa kosong & langkah berikutnya (untuk landing page, arahkan jadi konversi):

```tsx
export async function Testimonials() {
  const items = await getTestimonials()
  if (items.length === 0) {
    return (
      <div role="status" className="py-16 text-center">
        <h2>Testimoni segera hadir</h2>
        <p className="mt-2 text-slate-600">Jadilah salah satu pelanggan pertama Booqin.</p>
        <a href="#waitlist" className="mt-4 inline-block">Gabung waitlist</a>
      </div>
    )
  }
  return <ul>{items.map((t) => <Testimonial key={t.id} {...t} />)}</ul>
}
```

### 4.5 Error state — boundary + retry

Error Boundary menangkap "kerusakan" + retry (harus Class Component atau `react-error-boundary`). Di App Router: `error.tsx` per segment. Untuk error level-komponen, pasangkan dengan Suspense:

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary fallback={<SectionError />}>
  <Suspense fallback={<TestimonialsSkeleton />}>
    <Testimonials />
  </Suspense>
</ErrorBoundary>
```

Keamanan: jangan kirim detail error sensitif ke endpoint http tak terenkripsi — pakai HTTPS.

### 4.6 State form (waitlist)

`useActionState` + `useFormStatus` menangani idle/pending/success/error:

```tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { joinWhitelist } from '@/app/actions/join-whitelist'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Join the waitlist'}</button>
}

export function WhitelistForm() {
  const [state, action] = useActionState(joinWhitelist, null)
  if (state?.ok) return <p role="status" aria-live="polite">Berhasil! Cek email konfirmasimu.</p>
  return (
    <form action={action}>
      {/* ...input... */}
      {state?.error && <p role="alert">Masukkan email yang valid lalu coba lagi.</p>}
      <SubmitButton />
    </form>
  )
}
```

Untuk feedback instan, React 19 `useOptimistic` + Server Actions memberi UI optimistic tanpa API route terpisah.

### 4.7 `prefers-reduced-motion` global

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4.8 Hindari — state design

- ❌ Hanya mendesain happy-path.
- ❌ `if (isLoading)`/`if (error)` manual.
- ❌ Spinner generik di mana skeleton lebih baik.
- ❌ Animasi tanpa `prefers-reduced-motion`.
- ❌ Empty state kosong tanpa penjelasan/CTA.
- ❌ Error tanpa retry; form tanpa state pending.
- ❌ Melempar detail error sensitif ke endpoint tak terenkripsi.

---

## 5. 404 / 500 & Error Boundaries

Tiga file untuk tiga kategori berbeda:

| File | Menangani | Scope | Komponen |
|---|---|---|---|
| **`not-found.tsx`** | 404 (`notFound()` / route tak cocok) | Route segment | Server (default) |
| **`error.tsx`** | Runtime error tak tertangkap | Segment + children | **Client (wajib)** |
| **`global-error.tsx`** | Error di root layout | Seluruh app | Client (html/body) |

Error naik ke error boundary induk terdekat — tempatkan `error.tsx` di level berbeda untuk granularitas.

### 5.1 `not-found.tsx` — 404 yang membantu

Server Component, dipicu `notFound()`. Next.js otomatis mengembalikan status 404 + menyuntik `noindex`, dan mempertahankan shared layout/nav. 404 yang baik (pesan ramah, link beranda, search, konten populer, brand) menurunkan bounce dari 78% jadi 42%:

```tsx
// app/not-found.tsx — Server Component
import Link from 'next/link'
import { NotFoundTracker } from '@/components/not-found-tracker'

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <NotFoundTracker />
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="text-slate-600">Halaman yang kamu cari mungkin sudah dipindahkan atau tidak ada.</p>
      <div className="flex gap-3">
        <Link href="/">Kembali ke beranda</Link>
        <Link href="/#features">Lihat fitur</Link>
      </div>
    </main>
  )
}
```

Lacak 404 (useEffect + usePathname → analytics) untuk menemukan konten hilang / 301 redirect.

### 5.2 `notFound()` — catch-all CMS

```tsx
// app/(marketing)/[...slug]/page.tsx
import { notFound } from 'next/navigation'
import { getCachedPage } from '@/lib/cms/queries'

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const page = await getCachedPage(slug.join('/'))
  if (!page) notFound() // → not-found.tsx terdekat, status 404 + noindex otomatis
  return <BlockRenderer blocks={page.blocks} />
}
```

`notFound()` mengambil presedensi di atas `error.tsx`.

### 5.3 `error.tsx` — boundary + recovery

Wajib Client Component. Properti `digest` = hash untuk mencocokkan error klien dengan log server. Di produksi pesan error tidak diserialisasi ke klien (anti kebocoran) — andalkan digest + log server. `reset()` cocok untuk error transien; untuk persisten, perbaiki penyebab.

```tsx
// app/(marketing)/error.tsx
'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { reportError(error) }, [error]) // kirim digest (HTTPS!)
  return (
    <main className="flex min-h-[40dvh] flex-col items-center justify-center gap-4 text-center" role="alert">
      <h2 className="text-xl font-bold">Ada yang tidak beres</h2>
      <p className="text-slate-600">Coba muat ulang bagian ini.</p>
      <button onClick={reset}>Coba lagi</button>
    </main>
  )
}
```

### 5.4 `global-error.tsx` — pengaman cadangan root layout

Harus menyertakan `<html>`/`<body>` (menggantikan root layout); import CSS diabaikan (inline style saja). Jarang terpicu tapi tetap dibuat — lebih baik daripada layar putih:

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({ reset }: {
  error: Error & { digest?: string }; reset: () => void
}) {
  return (
    <html lang="id">
      <body style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Terjadi kesalahan kritis</h1>
          <p>Silakan muat ulang halaman.</p>
          <button onClick={reset}>Muat ulang</button>
        </div>
      </body>
    </html>
  )
}
```

### 5.5 Error level-komponen & monitoring

Native Next 16: `unstable_catchError` membungkus bagian mana pun dari component tree (alternatif stabil: `react-error-boundary`). Di produksi, lacak 404 & error (Sentry/Datadog/Vercel) dan cocokkan via `digest`.

### 5.6 Hindari — error/404

- ❌ Mengandalkan 404/500 default (putih, bounce tinggi).
- ❌ `error.tsx` tanpa `'use client'`.
- ❌ `global-error.tsx` tanpa `<html>`/`<body>` atau dengan import CSS.
- ❌ Menampilkan pesan error mentah ke user.
- ❌ Error tanpa retry; `reset()` untuk error persisten tanpa perbaikan.
- ❌ Tidak melacak 404; lupa `global-error.tsx`.

---

## 6. Bagaimana Semuanya Terhubung

Empat pilar UX & Reliability bukan daftar terpisah — semuanya lapisan ketangguhan yang dilewati saat halaman dirender, memastikan degradasi anggun di tiap titik:

```
1. Perangkat apa pun — mobile-first, container queries, dvh, fluid clamp
        ↓
2. Input apa pun — semantik, keyboard, focus-visible, screen reader
        ↓
3. Data dimuat — Suspense + skeleton (motion-safe) saat streaming
        ↓
4. Data tampil / kosong — empty state yang mengarahkan, bukan jalan buntu
        ↓
5. Sesuatu rusak — error boundary + reset/retry, digest ke log server
        ↓
6. Halaman tak ada / root gagal — not-found & global-error sebagai lapisan pengaman terakhir
```

Pemetaan kondisi → penanganan:

| Kondisi | Ditangani oleh | Bab |
|---|---|---|
| **Perangkat & viewport beragam** | mobile-first, container query, clamp, `dvh` | #2 |
| **Input non-mouse (keyboard/AT)** | semantik, focus-visible, ARIA seperlunya, form a11y | #3 |
| **Menunggu data / kosong** | Suspense + skeleton, empty state mengarahkan | #4 |
| **Kegagalan runtime / route hilang** | `error.tsx`, `not-found.tsx`, `global-error.tsx` | #5 |

Benang merahnya: tiap lapisan memastikan satu kelas masalah tidak menjatuhkan pengalaman. Responsive & a11y menjaga kualitas happy-path untuk semua orang di semua perangkat; state design & error boundary menjaga non-happy-path tetap anggun dengan jalan pulih. Karena semuanya dibangun di atas HTML semantik & arsitektur server-first dari kartu sebelumnya, ketangguhan ini datang dengan biaya tambahan yang minimal.

---

## 7. Referensi

Fakta versi, API, dan data diverifikasi terhadap dokumentasi resmi dan sumber industri (Juni 2026):

- Dokumentasi resmi Next.js — loading.js, error.js, not-found.js, global-not-found, Error Handling, Suspense.
- Dokumentasi React — Suspense, Accessibility, useOptimistic/useActionState/useFormStatus.
- Panduan responsive 2026 (UXPin, Ardena, Scrimba, LogRocket, Nucamp, dan lainnya) — container queries, clamp, dvh, cross-browser testing.
- Panduan a11y/WCAG 2.2 (Deque, AllAccessible, rtCamp, UXPin, accesstive) — semantik, ARIA, focus, modal, tes.
- Panduan state & error (BetterLink, freeCodeCamp, Vercel Academy, OneUptime) — Suspense, skeleton, error boundary, 404/500.

*Detail API & versi dapat berubah; verifikasi ulang sebelum keputusan final.*
