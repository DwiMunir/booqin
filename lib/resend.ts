import { Resend } from 'resend'
import { env } from '@/lib/env'

// RESEND_API_KEY server-only (TANPA NEXT_PUBLIC_). null sampai dikonfigurasi (mode credential-ready).
export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID)
}

export function getResend(): Resend | null {
  return env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
}
