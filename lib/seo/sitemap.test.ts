import { describe, expect, it } from 'vitest'
import { toSitemap } from './sitemap'

describe('toSitemap', () => {
  it('maps the home slug to the root url with priority 1', () => {
    const [home] = toSitemap(
      [{ slug: 'home', updatedAt: '2026-01-02T00:00:00.000Z' }],
      'https://booqin.test',
    )
    expect(home?.url).toBe('https://booqin.test')
    expect(home?.priority).toBe(1)
    expect(home?.lastModified).toEqual(new Date('2026-01-02T00:00:00.000Z'))
  })

  it('maps other slugs to /<slug> with lower priority and no date when absent', () => {
    const [p] = toSitemap([{ slug: 'pricing' }], 'https://booqin.test')
    expect(p?.url).toBe('https://booqin.test/pricing')
    expect(p?.priority).toBe(0.7)
    expect(p?.lastModified).toBeUndefined()
  })
})
