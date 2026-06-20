import { describe, expect, it } from 'vitest'
import { buildRobots } from './robots'

describe('buildRobots', () => {
  it('blocks all crawlers in non-production', () => {
    const r = buildRobots(false, 'https://booqin.test')
    expect(r.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(r.sitemap).toBeUndefined()
  })

  it('allows crawlers and exposes the sitemap in production', () => {
    const r = buildRobots(true, 'https://booqin.test')
    expect(r.rules).toEqual([{ userAgent: '*', allow: '/' }])
    expect(r.sitemap).toBe('https://booqin.test/sitemap.xml')
    expect(r.host).toBe('https://booqin.test')
  })
})
