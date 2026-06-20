import { describe, expect, it } from 'vitest'
import { type JoinState, joinWhitelist } from './join-whitelist'

const idle: JoinState = { status: 'idle' }

function form(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

describe('joinWhitelist', () => {
  it('errors when consent is missing', async () => {
    const r = await joinWhitelist(idle, form({ email: 'owner@venue.com' }))
    expect(r.status).toBe('error')
    if (r.status === 'error') expect(r.message).toMatch(/consent/i)
  })

  it('errors on an invalid email', async () => {
    const r = await joinWhitelist(idle, form({ email: 'nope', consent: 'on' }))
    expect(r.status).toBe('error')
  })

  it('pretends success when the honeypot is filled (bot)', async () => {
    const r = await joinWhitelist(
      idle,
      form({ email: 'owner@venue.com', consent: 'on', company: 'bot' }),
    )
    expect(r).toEqual({ status: 'success' })
  })

  it('succeeds in dry-run with a valid email + consent (no Resend creds)', async () => {
    const r = await joinWhitelist(idle, form({ email: 'owner@venue.com', consent: 'on' }))
    expect(r).toEqual({ status: 'success' })
  })
})
