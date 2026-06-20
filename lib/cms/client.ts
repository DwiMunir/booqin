import { createClient } from 'next-sanity'
import { env } from '@/lib/env'

export const SANITY_API_VERSION = '2026-02-01'

export function isSanityConfigured(): boolean {
  return Boolean(env.SANITY_PROJECT_ID && env.SANITY_DATASET)
}

// null sampai kredensial dikonfigurasi (mode credential-ready). useCdn true; freshness via Pola B.
export const sanityClient =
  env.SANITY_PROJECT_ID && env.SANITY_DATASET
    ? createClient({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        useCdn: true,
        token: env.SANITY_API_TOKEN,
      })
    : null
