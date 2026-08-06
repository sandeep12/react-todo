import { describe, expect, it } from 'vitest'

import { createAccessToken, verifyAccessToken } from './jwt.js'

describe('jwt', () => {
  const secret = 'test-secret'

  it('creates a token that includes exp and can be verified', () => {
    const token = createAccessToken('user-id', secret, 3600, 1_700_000_000)
    const payload = verifyAccessToken(token, secret, 1_700_000_000)

    expect(payload).toEqual({
      sub: 'user-id',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    })
  })

  it('rejects expired tokens', () => {
    const token = createAccessToken('user-id', secret, 60, 1_700_000_000)

    expect(verifyAccessToken(token, secret, 1_700_000_060)).toBeNull()
    expect(verifyAccessToken(token, secret, 1_700_000_061)).toBeNull()
  })

  it('rejects tokens signed with a different secret', () => {
    const token = createAccessToken('user-id', secret, 3600, 1_700_000_000)

    expect(verifyAccessToken(token, 'other-secret', 1_700_000_000)).toBeNull()
  })
})
