import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { buildRobots } from '@/lib/seo/robots'
import { site } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return buildRobots(env.APP_ENV === 'production', site.url)
}
