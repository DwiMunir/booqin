# Riset Forms & Compliance Landing Page Perusahaan
### Resend, Spam Protection, Privacy, dan i18n dengan Next.js 16

*Dokumen riset internal · Disusun Juni 2026*

---

## Daftar Isi

0. [Ringkasan Eksekutif](#0-ringkasan-eksekutif)
1. [Konteks & Prinsip](#1-konteks--prinsip)
2. [Resend Email Integration](#2-resend-email-integration)
3. [Spam Protection](#3-spam-protection)
4. [Privacy & Cookie Consent](#4-privacy--cookie-consent)
5. [i18n (Internationalization)](#5-i18n-internationalization)
6. [Bagaimana Semuanya Terhubung](#6-bagaimana-semuanya-terhubung)
7. [Referensi](#7-referensi)

---

## 0. Ringkasan Eksekutif

Dokumen ini merangkum riset Forms & Compliance untuk landing page perusahaan di Next.js 16, self-hosted — kartu terakhir, kelanjutan dari Foundation, Discoverability, Performance, UX & Reliability, dan Quality & Ops. Cakupannya empat pilar:

1. **Resend email integration** — Server Action: validasi zod, simpan ke Audience, email konfirmasi (React Email), deliverability (SPF/DKIM/DMARC).
2. **Spam protection** — pertahanan berlapis: honeypot (silent drop) + time check + rate limit per-IP + Turnstile opsional.
3. **Privacy & cookie consent** — pisahkan cookie-consent vs form-consent; manfaatkan stack cookieless agar (kemungkinan) tanpa banner; consent valid + privacy policy.
4. **i18n (internationalization)** — `next-intl` di App Router: routing locale, jaga static rendering, konten native per bahasa, hreflang.

Tesis intinya: **form waitlist yang efektif itu terlindungi, patuh, dan tidak menambah friksi** — kumpulkan email dengan benar, tangkis bot berlapis, hormati privasi by design, dan lokalkan hanya saat data membenarkan. Banyak irisan sudah disketsa lintas-kartu (Server Action + zod, honeypot + consent, analytics cookieless); kartu ini mengkonsolidasikan & memperdalamnya.

*Catatan: bagian privacy adalah informasi faktual, bukan nasihat hukum. Verifikasi ke ahli hukum/DPO untuk UU PDP Indonesia & GDPR.*

---

## 1. Konteks & Prinsip

Form whitelist Booqin tampak sederhana — satu field email — tapi di belakangnya ada empat tanggung jawab: mengirim email yang sampai inbox (bukan spam), menahan bot tanpa merepotkan pengguna, mematuhi hukum privasi, dan (opsional) melayani banyak bahasa.

Dua prinsip yang memandu:

- **Lindungi & patuhi tanpa friksi.** Tiap lapisan proteksi/compliance harus minim mengganggu konversi — honeypot tak terlihat, cookieless menghindari banner, consent satu checkbox jelas.
- **Compliance by design.** Kepatuhan terbaik bukan menambal belakangan, tapi memilih arsitektur (static-first, cookieless, data minimal) yang membuat sebagian kewajiban hilang dengan sendirinya.

Catatan irisan: Server Action + zod (Foundation), honeypot + consent + form a11y (UX), validasi sebagai endpoint publik + rate limiting + analytics cookieless (Quality & Ops), dan hreflang (Discoverability).

---

## 2. Resend Email Integration

### 2.1 Bentuk: dua langkah

Waitlist = (a) simpan email ke Audience + (b) kirim email konfirmasi via React Email — keduanya di **Server Action**. Integrasikan dengan direktif `'use server'` agar Resend hanya jalan di server (menjaga `RESEND_API_KEY`). Server Action memanggil langsung di server tanpa HTTP round-trip — lebih sederhana untuk form internal; API route untuk webhook/eksternal.

### 2.2 Template email (React Email)

Pakai `@react-email/components`, bukan HTML mentah — agar render benar di Outlook, Gmail, Apple Mail:

```tsx
// emails/waitlist-welcome.tsx
import { Body, Container, Head, Heading, Html, Preview, Text, Button } from '@react-email/components'

export function WaitlistWelcome({ email }: { email: string }) {
  return (
    <Html>
      <Head />
      <Preview>Kamu terdaftar di waitlist Booqin</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ padding: 32, backgroundColor: '#fff', borderRadius: 8 }}>
          <Heading>Selamat datang di Booqin 👋</Heading>
          <Text>Terima kasih sudah bergabung dengan waitlist. Kami kabari saat Booqin siap.</Text>
          <Button href="https://booqin.com"
            style={{ background: '#4f46e5', color: '#fff', padding: '12px 20px', borderRadius: 6 }}>
            Pelajari Booqin
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

### 2.3 Server Action lengkap

```ts
// app/actions/join-waitlist.ts
'use server'
import { z } from 'zod'
import { Resend } from 'resend'
import { WaitlistWelcome } from '@/emails/waitlist-welcome'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  email: z.string().email(),
  consent: z.literal(true),                 // checkbox wajib (privacy #4)
  company: z.string().max(0).optional(),    // honeypot (spam #3)
})

type State = { ok: true } | { ok: false; error: 'invalid' | 'spam' | 'server' } | null

export async function joinWaitlist(_prev: State, formData: FormData): Promise<State> {
  if (formData.get('company')) return { ok: false, error: 'spam' }

  const parsed = schema.safeParse({
    email: formData.get('email'),
    consent: formData.get('consent') === 'on',
    company: formData.get('company') ?? '',
  })
  if (!parsed.success) return { ok: false, error: 'invalid' }

  try {
    await resend.contacts.create({                  // 1) simpan ke Audience
      email: parsed.data.email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    })
    await resend.emails.send({                       // 2) konfirmasi (properti `react`)
      from: 'Booqin <hello@booqin.com>',             // domain TERVERIFIKASI
      to: [parsed.data.email],
      subject: 'Kamu terdaftar di waitlist Booqin',
      react: WaitlistWelcome({ email: parsed.data.email }),
    })
    return { ok: true }
  } catch (err) {
    console.error('waitlist gagal:', (err as Error).message) // tanpa API key/PII
    return { ok: false, error: 'server' }
  }
}
```

Client form (`useActionState`, state idle/pending/success/error) sudah dirancang di UX #2/#3.

### 2.4 Error handling

Selalu cek objek error & log; bungkus try/catch, kembalikan JSON error terstruktur, log **tanpa API key/penerima**, jangan kirim error mentah ke klien. Untuk email kritis: retry exponential backoff atau queue.

### 2.5 Deliverability — verifikasi domain (penentu utama)

Untuk kirim dari domain sendiri, verifikasi lewat dashboard dengan menambah record DNS — esensial untuk deliverability; domain tak terverifikasi (atau domain Resend bersama) menaikkan kemungkinan masuk spam.

- **SPF** (TXT) — daftar IP yang diizinkan + MX untuk feedback bounce/complaint.
- **DKIM** (TXT) — public key untuk verifikasi keaslian.
- **DMARC** — kebijakan cara penerima memperlakukan email tak terautentikasi, cegah impersonasi.

Wajib untuk kirim ke penerima arbitrer di produksi; tes ke inbox sendiri cukup API key — jangan blokir test pertama menunggu DNS.

### 2.6 Webhook & transaksional vs marketing

Webhook event (delivered/bounced/complained) → update DB untuk jaga reputasi (verifikasi signature svix dulu). Resend transaksional-first: **Audiences** mengumpulkan email + konfirmasi sekarang; **Broadcasts** untuk blast saat launch.

### 2.7 Hindari — Resend

- ❌ API key di client/`NEXT_PUBLIC_`.
- ❌ Kirim dari domain tak terverifikasi.
- ❌ HTML email mentah (rusak di Outlook/Gmail).
- ❌ Log API key/email penerima.
- ❌ Kirim error mentah ke klien.
- ❌ Webhook tanpa verifikasi signature.
- ❌ Abaikan bounce/complaint.

---

## 3. Spam Protection

### 3.1 Prinsip: berlapis, dari yang termurah

Satu CAPTCHA tidak pernah cukup. Form aman = arsitektur anti-abuse berlapis yang menghentikan bot sebelum mencapai business logic; pola terbukti: rate limit → honeypot → CAPTCHA, request mencapai logika hanya kalau lolos semua. Urutkan dari cek paling tanpa-friksi. Untuk waitlist, seimbangkan proteksi vs konversi — 15% pengguna meninggalkan form saat dihadapkan tantangan CAPTCHA.

### 3.2 Lapis 1 — Honeypot

Field tersembunyi yang user tak lihat; bot mengisi tiap field → kalau terisi, itu bot. Tiga detail: **silent drop** (kembalikan sukses, bukan error — bot retry saat error & belajar terdeteksi), **penamaan** (jangan `honeypot`/`trap`; pakai `website`/`company` yang tampak sah), dan **sembunyikan benar** (`aria-hidden`, `tabIndex={-1}`, `.sr-only` — agar password manager tak mengisi untuk manusia).

```tsx
<input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
```

### 3.3 Lapis 1.5 — Time check

Honeypot + time check memberi proteksi memadai untuk form kontak/newsletter tanpa friksi. Submit < 2 detik = bot:

```tsx
<input type="hidden" name="ts" value={renderedAt} /> {/* Date.now() saat mount */}
```

### 3.4 Lapis 2 — Rate limiting

Batasi request per IP per window. In-memory reset saat restart → pakai store terdistribusi (Redis/Upstash) di produksi; ambil IP dari `x-forwarded-for`, kembalikan 429. Rate limiting **server-side** menangkap script yang POST langsung melewati cek client.

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 submit / 10 menit per IP
})
```

### 3.5 Lapis 3 — Cloudflare Turnstile (opsional)

Alternatif CAPTCHA ramah-privasi yang memindahkan verifikasi ke background (tanpa "pilih lampu lalu lintas"), memperbaiki conversion. Mode Invisible ideal. **Bisa dipakai independen — tak wajib memproksi traffic lewat CDN Cloudflare** (penting untuk self-host). Site Key (publik) + Secret Key (server); validasi token server-side di `/siteverify`, proses hanya jika `success: true`.

```ts
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  })
  return (await res.json()).success === true
}
```

### 3.6 Merangkai (urutan di Server Action)

```ts
// LAPIS 1: honeypot → silent drop
if (formData.get('website')) return { ok: true }
// ... validasi zod ...
// LAPIS 1.5: time check → submit < 2 detik = bot
if (Date.now() - parsed.data.ts < 2000) return { ok: true }
// LAPIS 2: rate limit per IP
const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
if (!(await ratelimit.limit(ip)).success) return { ok: false, error: 'rate' }
// LAPIS 3 (opsional): verifikasi Turnstile
// ✅ lolos semua → simpan + konfirmasi (#2)
```

Catat (log terstruktur Quality & Ops) saat honeypot/rate limit terpicu — dengan IP — untuk deteksi pola serangan.

### 3.7 Hindari — spam

- ❌ Mengandalkan satu lapisan.
- ❌ Honeypot kembalikan error (beri tahu bot trap-nya).
- ❌ Honeypot bernama `honeypot`/`trap` atau tanpa `aria-hidden`.
- ❌ Rate limit in-memory di produksi multi-instance.
- ❌ CAPTCHA terlihat untuk waitlist (15% abandon).
- ❌ `TURNSTILE_SECRET_KEY` di client.
- ❌ Proses submission tanpa verifikasi token server-side.

---

## 4. Privacy & Cookie Consent

*Informasi faktual, bukan nasihat hukum.*

### 4.1 Dua "consent" yang berbeda

Jangan dicampur: **cookie consent** (ePrivacy/GDPR) untuk cookie/tracking non-esensial → ditangani **cookie banner**; **form/marketing consent** untuk memproses & mengirim email → ditangani **checkbox** di form. Checkbox tidak menggantikan banner, dan sebaliknya.

### 4.2 Hasil elegan: desain agar banner tak perlu

Kepatuhan terbaik adalah tidak mengumpulkan. Yang butuh consent: cookie analytics perilaku, advertising, social, preference non-esensial, third-party; yang dikecualikan: session, autentikasi, load balancing, keamanan. Stack kita (static-first, tanpa GA4/Pixel, analytics cookieless Plausible/Umami) kemungkinan **tak menaruh cookie non-esensial → tak perlu banner**.

**Peringatan:** tool "cookieless" tetap mungkin butuh consent kalau memproses PII (IP/identifier unik). Plausible/Umami dirancang tidak melakukannya — tapi verifikasi konfigurasimu.

### 4.3 Checkbox consent form (yang sudah ada)

Consent harus informed, freely given, specific, unambiguous; hindari pre-checked atau "dengan melanjutkan...". Checkbox **tidak pre-checked**, spesifik, menaut privacy policy:

```tsx
<input id="consent" name="consent" type="checkbox" required />
<label htmlFor="consent">
  Saya setuju menerima email tentang Booqin dan menyetujui <a href="/privacy">Kebijakan Privasi</a>.
</label>
```

Plus **data minimization**: email saja untuk waitlist.

### 4.4 Kalau memang butuh banner

Aturan teknis yang 90% situs salah: **blokir skrip sebelum consent** — analytics tak boleh dimuat saat page render; memuatnya sebelum consent = data diproses tanpa dasar hukum, dan banner setelahnya tak memperbaiki retroaktif. Jangan "muat lalu putuskan" — jangan muat sama sekali. Tes: nol request ke domain tracking sebelum klik. Tombol **Accept** & **Reject** sama menonjol; granular per tujuan; tanpa dark pattern.

```tsx
// components/cookie-consent.tsx — HANYA jika memuat skrip non-esensial
'use client'
import { useEffect, useState } from 'react'

export function CookieConsent() {
  const [decided, setDecided] = useState(true)
  useEffect(() => { setDecided(document.cookie.includes('cookie-consent=')) }, [])
  if (decided) return null

  function decide(value: 'accepted' | 'rejected') {
    document.cookie = `cookie-consent=${value}; max-age=31536000; path=/; SameSite=Lax`
    setDecided(true)
    if (value === 'accepted') loadAnalytics() // dimuat HANYA setelah accept
  }
  return (
    <div role="dialog" aria-label="Persetujuan cookie">
      <p>Cookie analitik untuk memperbaiki situs. Detail di <a href="/privacy">Kebijakan Privasi</a>.</p>
      <button onClick={() => decide('rejected')}>Tolak</button>
      <button onClick={() => decide('accepted')}>Terima</button>
    </div>
  )
}
```

### 4.5 Consent logging & privacy policy

GDPR mengharuskan consent "didokumentasikan" tapi tidak harus database — first-party cookie yang menyimpan preferensi sudah cukup (konfirmasi otoritas privasi); solusi sederhana yang benar. Privacy policy minimal ungkap: data dikumpulkan (email; IP/timestamp anti-spam), tujuan, dasar hukum (consent), pihak ketiga (Resend), retensi, hak pengguna (akses/hapus/tarik consent/unsubscribe), kontak.

### 4.6 Cakupan geografis

GDPR berlaku berdasarkan **lokasi pengguna, bukan bisnis** — satu pengunjung EU = kewajiban, tanpa ambang traffic. Untuk Booqin: UU PDP domestik, GDPR bila ada pengunjung Eropa, plus rezim lain (CCPA, LGPD). Pendekatan cookieless menyederhanakan kepatuhan lintas-yurisdiksi.

### 4.7 Hindari — privacy

- ❌ Checkbox pre-checked / "dengan melanjutkan berarti setuju".
- ❌ Memuat analytics/pixel sebelum consent.
- ❌ Reject lebih sulit dari Accept / dark pattern.
- ❌ Satu checkbox "setuju semua cookie" (harus granular).
- ❌ Mengira cookieless = otomatis bebas consent.
- ❌ Mengumpulkan data berlebih.
- ❌ Tanpa privacy policy yang mudah ditemukan.

---

## 5. i18n (Internationalization)

### 5.1 Butuh sekarang?

Jangan terjemahkan sebelum validasi. Rilis MVP satu locale; tambah locale kedua setelah ≥5% session share dari negara non-anglophone selama 4 minggu — i18n prematur sumber #1 file terjemahan basi. Untuk Booqin: pilih satu bahasa untuk launch, tambah i18n saat data membenarkan.

### 5.2 Pergeseran App Router & model tiga lapisan

App Router menghapus i18n config bawaan (Pages-only) — disengaja; sekarang `[locale]` dynamic segment + middleware + library. Tiga lapisan: **routing** (next-intl), **konten** (Sanity), **SEO** (hreflang) — kebanyakan developer melewatkan lapis SEO.

### 5.3 Library & jebakan static rendering

Pakai **next-intl** (~2KB, RSC-native, kompilasi pesan ahead-of-time). Jebakan kritis (seperti nonce CSP): `setRequestLocale(locale)` mengaktifkan static rendering — tanpanya semua halaman jadi dinamis.

### 5.4 Routing

```ts
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  localePrefix: 'always',   // /id/, /en/ — paling jelas untuk SEO
})
```

```ts
// proxy.ts (Next 16; dulu middleware.ts)
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] }
```

### 5.5 Locale layout (file paling penting)

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)                  // KUNCI: aktifkan static rendering
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  return (
    <html lang={locale} dir={dir}>
      <body><NextIntlClientProvider>{children}</NextIntlClientProvider></body>
    </html>
  )
}
```

### 5.6 Pesan UI & konten CMS (lapisan terpisah)

UI string di `messages/{locale}.json` (via `useTranslations`, jalan di Server & Client); konten dinamis dari Sanity (localized type, field-level). **Jangan auto-translate konten** — menimbulkan duplicate-content SEO & factual drift; tulis native per locale.

```tsx
import { useTranslations } from 'next-intl'
export default function Page() {
  const t = useTranslations('hero')
  return <h1>{t('headline')}</h1>
}
```

### 5.7 SEO / hreflang (nyambung Discoverability)

```ts
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  return {
    alternates: {
      canonical: `https://booqin.com/${locale}`,
      languages: {
        id: 'https://booqin.com/id',
        en: 'https://booqin.com/en',
        'x-default': 'https://booqin.com/id',
      },
    },
  }
}
```

Pastikan sitemap & hreflang mencerminkan URL yang benar-benar disajikan; buat sitemap multi-bahasa.

### 5.8 Hindari — i18n

- ❌ i18n prematur sebelum data membenarkan.
- ❌ Lupa `setRequestLocale` (semua halaman jadi dinamis).
- ❌ Auto-translate konten (duplicate content + drift).
- ❌ Mencampur lapis UI & konten.
- ❌ Lupa hreflang/`x-default` atau tak cocok URL tersaji.
- ❌ Lupa `lang`/`dir` di `<html>`.

---

## 6. Bagaimana Semuanya Terhubung

Empat pilar Forms & Compliance mengikuti perjalanan satu pendaftaran waitlist — dari input, melewati lapisan proteksi & kepatuhan, sampai tersimpan & terkonfirmasi:

```
1. User isi form — email + consent checkbox (tidak pre-checked), data minimal
        ↓
2. Anti-spam berlapis — honeypot (silent drop) → time check → rate limit per-IP → Turnstile opsional
        ↓
3. Server Action — validasi zod, consent tercatat, secret server-only
        ↓
4. Resend — simpan ke Audience + email konfirmasi (React Email, domain SPF/DKIM/DMARC)
        ↓
5. Compliance — privacy policy + analytics cookieless (kemungkinan tanpa cookie banner)
        ↓
6. i18n (saat data membenarkan) — locale routing + konten native + hreflang
```

Pemetaan kebutuhan → penanganan:

| Kebutuhan | Ditangani oleh | Bab |
|---|---|---|
| **Kumpulkan & konfirmasi email** | Server Action + Resend Audience + React Email | #2 |
| **Tangkis bot/spam** | honeypot + time check + rate limit + Turnstile | #3 |
| **Patuh privasi** | consent valid + cookieless + privacy policy | #4 |
| **Multi-bahasa (opsional)** | next-intl + konten native CMS + hreflang | #5 |

Benang merahnya: form sederhana itu sebenarnya titik temu empat disiplin. Resend memastikan email sampai; spam protection menjaga kualitas lead tanpa merepotkan pengguna; privacy by design (cookieless + consent + minimization) memenuhi hukum sekaligus menyederhanakannya; dan i18n menunggu sampai data membenarkan. Karena semuanya dibangun di atas arsitektur kartu sebelumnya (Server Action, static-first, cookieless analytics), kepatuhan & proteksi datang dengan friksi minimal — baik untuk pengguna maupun konversi.

---

## 7. Referensi

Fakta versi, API, dan data diverifikasi terhadap dokumentasi resmi dan sumber industri (Juni 2026):

- Dokumentasi resmi Resend & React Email — Server Actions, contacts/audiences, domain verification (SPF/DKIM/DMARC), webhooks.
- Panduan spam protection (Cloudflare Turnstile docs, Upstash rate limiting, panduan honeypot/time-check 2026).
- Panduan privacy & cookie consent 2026 (secureprivacy, Termly, GDPR Advisor, cookie-banner.ca, PostHog, myagileprivacy) — GDPR/ePrivacy, block-before-consent, consent logging.
- Dokumentasi next-intl & panduan i18n Next.js 16 (next-intl.dev, Build with Matija, APITube, Intlayer) — routing, setRequestLocale, hreflang, Sanity localization.

*Detail data, versi, dan kebijakan dapat berubah; verifikasi ulang sebelum keputusan final. Bagian privacy bukan nasihat hukum.*
