import { logger } from './lib/logger'

// Dipanggil sekali saat server boot. Init Sentry HANYA bila SENTRY_DSN diisi (credential-ready).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    await import('./sentry.server.config')
    logger.info('sentry_initialized')
  }
}

// Funnel error server (Server Component / Route Handler / Server Action). Selalu log terstruktur;
// teruskan ke Sentry bila dikonfigurasi. Cocokkan ke log klien lewat `digest`.
export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
  context: unknown,
) {
  logger.error('request_error', {
    path: request?.path,
    method: request?.method,
    digest: (err as { digest?: string })?.digest,
    message: err instanceof Error ? err.message : String(err),
  })
  if (process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureRequestError(err as Error, request as never, context as never)
  }
}
