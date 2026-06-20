import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FaqAccordion } from './faq-accordion'

const items = [
  { q: 'Q one', a: 'Answer one' },
  { q: 'Q two', a: 'Answer two' },
]

describe('FaqAccordion', () => {
  it('opens the first item by default', () => {
    render(<FaqAccordion items={items} />)
    expect(screen.getByText('Answer one')).toBeInTheDocument()
    expect(screen.queryByText('Answer two')).not.toBeInTheDocument()
  })

  it('toggles to another item on click', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion items={items} />)
    await user.click(screen.getByRole('button', { name: 'Q two' }))
    expect(screen.getByText('Answer two')).toBeInTheDocument()
    expect(screen.queryByText('Answer one')).not.toBeInTheDocument()
  })
})
