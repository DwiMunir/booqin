import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WhitelistForm } from './whitelist-form'

describe('WhitelistForm', () => {
  it('renders email, consent checkbox, and submit', () => {
    render(<WhitelistForm variant="hero" trust="No spam — ever." />)
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText(/agree to receive early-access/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument()
  })

  it('shows the success state after a valid dry-run submit', async () => {
    const user = userEvent.setup()
    render(<WhitelistForm variant="hero" trust="x" />)
    await user.type(screen.getByLabelText('Email address'), 'owner@venue.com')
    await user.click(screen.getByLabelText(/agree to receive early-access/i))
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }))
    expect(await screen.findByText("You're on the list.")).toBeInTheDocument()
  })

  it('shows an error when consent is not given', async () => {
    const user = userEvent.setup()
    render(<WhitelistForm variant="cta" trust="x" />)
    await user.type(screen.getByLabelText('Email address'), 'owner@venue.com')
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }))
    expect(await screen.findByText(/confirm consent/i)).toBeInTheDocument()
  })
})
