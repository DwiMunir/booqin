import * as Sentry from '@sentry/nextjs'

// Hanya di-import oleh instrumentation.register() saat SENTRY_DSN diisi (credential-ready).
// enabled di-gate ke DSN sebagai pengaman ganda.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.APP_ENV ?? 'development',
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
})
