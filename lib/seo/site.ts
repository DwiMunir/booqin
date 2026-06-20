import { env } from '@/lib/env'

export const site = {
  name: 'Booqin',
  url: env.NEXT_PUBLIC_SITE_URL,
  title: 'Booqin — The AI booking assistant for venue owners',
  description:
    'List your space and hand the back-and-forth to Booqin — the AI assistant that answers inquiries, qualifies leads, manages your calendar, and follows up 24/7.',
  tagline: 'The AI booking assistant for venue owners.',
} as const
