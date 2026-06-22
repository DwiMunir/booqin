'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { allowRequest } from '@/lib/ratelimit'
import { getResend } from '@/lib/resend'

export type JoinState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const emailSchema = z.string().trim().email()
const MIN_SUBMIT_MS = 2000 // submit < 2 detik sejak render = kemungkinan bot
const FROM = env.RESEND_FROM ?? 'Booqin <hello@booqin.moonir.dev>'

// try/catch: headers() melempar di luar request scope (mis. unit test) -> 'unknown'.
async function clientIp(): Promise<string> {
  try {
    const h = await headers()
    return (
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip')?.trim() ?? 'unknown'
    )
  } catch {
    return 'unknown'
  }
}

export async function joinWhitelist(_prev: JoinState, formData: FormData): Promise<JoinState> {
  // Lapis 1 — honeypot: bot mengisi field tersembunyi -> silent drop (pura-pura sukses).
  const honeypot = formData.get('company')
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    logger.warn('waitlist_honeypot', { ip: await clientIp() })
    return { status: 'success' }
  }

  // Consent wajib.
  if (formData.get('consent') !== 'on') {
    return { status: 'error', message: 'Please confirm consent to continue.' }
  }

  // Email valid.
  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }
  const email = parsed.data

  // Lapis 1.5 — time check: submit terlalu cepat sejak render = bot -> silent drop.
  // Guard elapsed >= 0 untuk hindari false-positive akibat skew jam klien.
  const ts = Number(formData.get('ts'))
  if (Number.isFinite(ts) && ts > 0) {
    const elapsed = Date.now() - ts
    if (elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
      return { status: 'success' }
    }
  }

  // Lapis 2 — rate limit per-IP (aktif bila Upstash dikonfigurasi).
  const ip = await clientIp()
  if (!(await allowRequest(ip))) {
    logger.warn('waitlist_rate_limited', { ip })
    return { status: 'error', message: 'Too many attempts. Please try again in a few minutes.' }
  }

  // Credential-ready: tanpa kredensial Resend -> dry-run (tak panggil Resend).
  const resend = getResend()
  const audienceId = env.RESEND_AUDIENCE_ID
  if (!resend || !audienceId) {
    return { status: 'success' }
  }

  try {
    // 1) simpan ke Audience (utama)
    const { error } = await resend.contacts.create({ email, audienceId, unsubscribed: false })
    if (error) {
      logger.error('waitlist_contact_failed', { reason: error.message })
      return { status: 'error', message: 'Something went wrong on our end. Please try again.' }
    }

    // 2) email konfirmasi (best-effort: gagal kirim TIDAK menggagalkan signup yang sudah tersimpan)
    try {
      const { WaitlistWelcome } = await import('@/emails/waitlist-welcome')
      const { error: sendErr } = await resend.emails.send({
        from: FROM,
        to: [email],
        subject: "You're on the Booqin waitlist",
        react: WaitlistWelcome(),
      })
      if (sendErr) logger.warn('waitlist_email_failed', { reason: sendErr.message })
    } catch (e) {
      logger.warn('waitlist_email_exception', {
        message: e instanceof Error ? e.message : String(e),
      })
    }

    return { status: 'success' }
  } catch {
    return { status: 'error', message: 'Something went wrong on our end. Please try again.' }
  }
}
