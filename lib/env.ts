import { z } from 'zod'

/**
 * Validasi env, fail-fast. Var Sanity (Fase 2) & Resend (Fase 3) opsional sampai diisi.
 * Secret TIDAK boleh ber-prefix NEXT_PUBLIC_.
 *
 * Penting: `.env` sering berisi key kosong (mis. `RESEND_AUDIENCE_ID=`). String kosong itu
 * di-normalisasi jadi `undefined` lebih dulu, supaya `.default()` & `.optional()` jalan
 * (kalau tidak, `z.string().min(1)` menolak `''` dan build gagal).
 */
const blankToUndefined = (v: string | undefined): string | undefined => {
  const t = v?.trim()
  return t ? t : undefined
}

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),

  // Fase 2 — Sanity.
  SANITY_PROJECT_ID: z.string().min(1).optional(),
  SANITY_DATASET: z.string().min(1).optional(),
  SANITY_API_TOKEN: z.string().min(1).optional(),
  CMS_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Fase 3 — Resend (server-only).
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_AUDIENCE_ID: z.string().min(1).optional(),
  RESEND_FROM: z.string().min(1).optional(), // mis. "Booqin <hello@domain>" (domain TERVERIFIKASI)

  // Monitoring (opsional, credential-ready) — Sentry aktif saat SENTRY_DSN diisi.
  SENTRY_DSN: z.string().min(1).optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
})

export const env = schema.parse({
  NEXT_PUBLIC_SITE_URL: blankToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  APP_ENV: blankToUndefined(process.env.APP_ENV),
  SANITY_PROJECT_ID: blankToUndefined(process.env.SANITY_PROJECT_ID),
  SANITY_DATASET: blankToUndefined(process.env.SANITY_DATASET),
  SANITY_API_TOKEN: blankToUndefined(process.env.SANITY_API_TOKEN),
  CMS_WEBHOOK_SECRET: blankToUndefined(process.env.CMS_WEBHOOK_SECRET),
  RESEND_API_KEY: blankToUndefined(process.env.RESEND_API_KEY),
  RESEND_AUDIENCE_ID: blankToUndefined(process.env.RESEND_AUDIENCE_ID),
  RESEND_FROM: blankToUndefined(process.env.RESEND_FROM),
  SENTRY_DSN: blankToUndefined(process.env.SENTRY_DSN),
  SENTRY_ENVIRONMENT: blankToUndefined(process.env.SENTRY_ENVIRONMENT),
})
