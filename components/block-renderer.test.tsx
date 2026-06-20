import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BlockRenderer } from '@/components/block-renderer'
import type { PageBlock } from '@/lib/cms/types'
import { homePage } from '@/lib/content/home-page'

describe('BlockRenderer', () => {
  it('renders the full home pageBuilder with exactly one <h1>', () => {
    const { container } = render(<BlockRenderer blocks={homePage.pageBuilder} />)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(document.getElementById('hero')).not.toBeNull()
    expect(document.getElementById('faq')).not.toBeNull()
  })

  it('skips unknown block types without crashing, still renders known siblings', () => {
    const unknown = { _type: 'mysteryBlock', _key: 'x' } as unknown as PageBlock
    const faqBlock: PageBlock = {
      _type: 'faq',
      _key: 'f',
      eyebrow: 'Questions',
      heading: 'FAQ heading here',
      items: [{ q: 'Q1', a: 'A1' }],
    }
    render(<BlockRenderer blocks={[unknown, faqBlock]} />)
    expect(screen.getByText('FAQ heading here')).toBeInTheDocument()
  })
})
