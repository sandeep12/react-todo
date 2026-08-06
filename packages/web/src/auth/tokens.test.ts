import { afterEach, describe, expect, it } from 'vitest'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasStoredTokens,
  setAccessToken,
  setTokens,
} from './tokens'

describe('token storage', () => {
  afterEach(() => {
    clearTokens()
  })

  it('stores and retrieves access and refresh tokens', () => {
    setTokens('access-token', 'refresh-token')

    expect(getAccessToken()).toBe('access-token')
    expect(getRefreshToken()).toBe('refresh-token')
    expect(hasStoredTokens()).toBe(true)
  })

  it('updates only the access token', () => {
    setTokens('access-token', 'refresh-token')
    setAccessToken('new-access-token')

    expect(getAccessToken()).toBe('new-access-token')
    expect(getRefreshToken()).toBe('refresh-token')
  })

  it('clears stored tokens', () => {
    setTokens('access-token', 'refresh-token')
    clearTokens()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(hasStoredTokens()).toBe(false)
  })
})
