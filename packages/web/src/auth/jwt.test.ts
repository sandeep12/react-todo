import { describe, expect, it } from 'vitest'

import { isAccessTokenExpired, parseJwtPayload } from './jwt'

function createToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')

  return `${header}.${body}.signature`
}

describe('jwt helpers', () => {
  it('parses a JWT payload', () => {
    const token = createToken({ sub: 'user-id', exp: 4_102_444_800 })

    expect(parseJwtPayload(token)).toEqual({
      sub: 'user-id',
      exp: 4_102_444_800,
    })
  })

  it('detects expired access tokens', () => {
    const expiredToken = createToken({ exp: Math.floor(Date.now() / 1000) - 60 })
    const validToken = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 })

    expect(isAccessTokenExpired(expiredToken)).toBe(true)
    expect(isAccessTokenExpired(validToken)).toBe(false)
  })
})
