import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { env } from '@/lib/env'

// Webhook publish Sanity -> revalidate tag per-halaman (Pola B). Projection webhook kirim { slug }.
type WebhookPayload = { slug?: string; _type?: string }

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      env.CMS_WEBHOOK_SECRET,
      // delay agar CDN Sanity sudah ter-update sebelum revalidate
      true,
    )

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 })
    }
    const slug = body?.slug
    if (!slug) {
      return new Response('Missing slug in webhook payload', { status: 400 })
    }

    revalidateTag(`page:${slug}`, 'max')
    return NextResponse.json({ revalidated: `page:${slug}` })
  } catch (err) {
    return new Response((err as Error).message, { status: 500 })
  }
}
