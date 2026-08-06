import { describe, expect, it } from 'vitest'

import { generateRefreshToken, hashRefreshToken } from './tokens.js'

describe('refresh tokens', () => {
  it('hashes tokens deterministically', () => {
    const token = 'refresh-token-value'

    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token))
    expect(hashRefreshToken(token)).not.toBe(token)
  })

  it('generates unique refresh tokens', () => {
    const first = generateRefreshToken()
    const second = generateRefreshToken()

    expect(first).not.toBe(second)
    expect(first.length).toBeGreaterThan(0)
  })
})
