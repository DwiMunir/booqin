# Booqin Fase 3 — Form Whitelist → Resend (Credential-Ready) — Design Spec

> Disetujui 2026-06-20. Mode: **credential-ready** (dry-run bila env Resend kosong). P2 (email konfirmasi, rate limiting) **ditunda**.

## Tujuan
Jadikan form waitlist (kini stub client) **nyata**: Server Action ber-validasi (zod) + anti-spam (honeypot + consent wajib) yang menambah kontak ke audience Resend. Tanpa kredensial → dry-run (validasi jalan, sukses tampil, panggilan Resend di-skip).

## Komponen
| File | Isi |
|---|---|
| `lib/resend.ts` | `getResend()` (Resend instance atau null) + `isResendConfigured()`. `RESEND_API_KEY` server-only. |
| `app/actions/join-whitelist.ts` | `'use server'`. `joinWhitelist(prev, formData)`: honeypot → consent wajib → email valid (zod) → `resend.contacts.create({ email, audienceId, unsubscribed:false })` atau dry-run. Return `JoinState = { status:'idle'|'success'|'error'; message? }`. |
| `components/client/whitelist-form.tsx` | refactor ke `useActionState`: `<form action>`, input uncontrolled, **consent checkbox wajib**, honeypot, state pending (tombol "Joining…" + disabled), success card / pesan error dari state. |

## Alur Server Action
1. Honeypot (`company`) terisi → return `success` (pura-pura; bot tak tahu diblok).
2. `consent !== 'on'` → `error` ("Please confirm consent to continue.").
3. email gagal `z.string().trim().email()` → `error` ("Please enter a valid email address.").
4. `getResend()`/`audienceId` tak ada → `success` (dry-run, credential-ready).
5. `resend.contacts.create(...)` → `success`; throw → `error` (pesan generik).

## Perubahan visual (minimal)
+1 baris **consent checkbox** wajib di bawah input (label: "I agree to receive early-access emails from Booqin."). Trust line tetap. Dua varian (hero terang / CTA gelap). Tombol submit: "Joining…" + disabled saat pending.

## Testing
- **Unit action** (`app/actions/join-whitelist.test.ts`): tanpa consent → error; email invalid → error; honeypot terisi → success; valid+consent (dry-run) → success.
- **Integrasi form** (`whitelist-form.test.tsx`): render consent+email+button; submit valid+consent → success card; submit tanpa consent → pesan error. (Action jalan in-process di jsdom; `useActionState` menerima fungsi async biasa.)
- Tes lama `isValidEmail` dihapus (validasi pindah ke action).

## Env & dep
- Dep baru: `resend`.
- `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` sudah ada di `lib/env.ts` (opsional). Isi `.env` untuk aktif; uji live **lokal** (outbound, tanpa tunnel).

## Ditunda
Email konfirmasi (`resend.emails.send` + React Email), rate limiting per-IP (Upstash Redis).

## Gate
`pnpm typecheck && lint && test && build` lulus; smoke: form render dgn consent, submit dry-run → success.
