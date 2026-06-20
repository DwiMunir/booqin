import { type NextRequest, NextResponse } from 'next/server'

// MVP: terima metric Web Vitals, log server-side. (Kirim ke analytics eksternal = follow-up.)
export async function POST(req: NextRequest) {
  try {
    const metric = (await req.json()) as { name?: string; value?: number; rating?: string }
    console.log('[web-vitals]', metric.name, Math.round(metric.value ?? 0), metric.rating)
  } catch {
    // abaikan payload tak valid
  }
  return new NextResponse(null, { status: 204 })
}
