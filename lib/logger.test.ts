import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger'

afterEach(() => vi.restoreAllMocks())

describe('logger', () => {
  it('emits one JSON line with level, msg, time, and meta', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('request_failed', { correlationId: 'abc', status: 503 })
    expect(spy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(spy.mock.calls[0]?.[0] as string)
    expect(parsed).toMatchObject({
      level: 'error',
      msg: 'request_failed',
      correlationId: 'abc',
      status: 503,
    })
    expect(typeof parsed.time).toBe('string')
  })

  it('routes info to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('boot')
    expect(JSON.parse(spy.mock.calls[0]?.[0] as string).level).toBe('info')
  })
})
