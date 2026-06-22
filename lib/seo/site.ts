import { env } from '@/lib/env'

export const site = {
  name: 'Booqin',
  url: env.NEXT_PUBLIC_SITE_URL,
  title: 'Booqin — The AI booking assistant for venue owners',
  description:
    'Booqin is the AI booking assistant for venue owners — it answers inquiries instantly, qualifies leads, and fills your calendar 24/7 so you book more dates.',
  tagline: 'The AI booking assistant for venue owners.',
  // Kontak privasi/umum. GANTI dengan inbox asli yang kamu pantau.
  email: 'hello@booqin.moonir.dev',
} as const
