import { describe, expect, it } from 'vitest'

import { getCurrentSessionId } from './currentSession'
import { clearTokens, setTokens } from '../auth/tokens'

function createToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')

  return `${header}.${body}.signature`
}

describe('getCurrentSessionId', () => {
  it('returns the session id from the access token payload', () => {
    setTokens(createToken({ sid: 'session-123', exp: 4_102_444_800 }), 'refresh-token')

    expect(getCurrentSessionId()).toBe('session-123')
  })

  it('returns null when no access token is stored', () => {
    clearTokens()

    expect(getCurrentSessionId()).toBeNull()
  })
})
