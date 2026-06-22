import { connection } from 'next/server'
import { isSanityConfigured, sanityClient } from '@/lib/cms/client'

// Health check yang VERIFIKASI dependency (bukan sekadar 200). connection() → live per-request
// (tak di-prerender/cache). Ping Sanity UNCACHED (bukan getCachedPage yang ter-cache 'max').
// Arahkan uptime eksternal ke sini, bukan ke /.
export async function GET() {
  await connection()

  // Tanpa kredensial: app sengaja pakai fallback hardcode → sehat.
  if (!isSanityConfigured() || !sanityClient) {
    return Response.json({ status: 'ok', cms: 'fallback' }, { status: 200 })
  }

  try {
    await sanityClient.fetch('count(*[_type == "page"])')
    return Response.json({ status: 'ok', cms: 'connected' }, { status: 200 })
  } catch {
    return Response.json({ status: 'degraded', cms: 'unreachable' }, { status: 503 })
  }
}
