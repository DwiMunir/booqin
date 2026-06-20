'use server'

import { z } from 'zod'
import { env } from '@/lib/env'
import { getResend } from '@/lib/resend'

export type JoinState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const emailSchema = z.string().trim().email()

export async function joinWhitelist(_prev: JoinState, formData: FormData): Promise<JoinState> {
  // Anti-spam 1 — honeypot: bot mengisi field tersembunyi -> pura-pura sukses, jangan proses.
  const honeypot = formData.get('company')
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { status: 'success' }
  }

  // Anti-spam 2 — consent wajib (checkbox -> 'on' bila dicentang).
  if (formData.get('consent') !== 'on') {
    return { status: 'error', message: 'Please confirm consent to continue.' }
  }

  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }
  const email = parsed.data

  // Credential-ready: tanpa kredensial -> dry-run (tak panggil Resend).
  const resend = getResend()
  const audienceId = env.RESEND_AUDIENCE_ID
  if (!resend || !audienceId) {
    return { status: 'success' }
  }

  try {
    const { error } = await resend.contacts.create({ email, audienceId, unsubscribed: false, })
    if (error) {
      return { status: 'error', message: 'Something went wrong on our end. Please try again.' }
    }

    return { status: 'success' }
  } catch {
    return { status: 'error', message: 'Something went wrong on our end. Please try again.' }
  }
}
