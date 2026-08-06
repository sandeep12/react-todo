import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authFetch } from './apiClient'
import { resetRefreshState } from './refresh'
import { clearTokens, setTokens } from './tokens'

function createToken(expOffsetSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
    }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')

  return `${header}.${body}.signature`
}

describe('authFetch', () => {
  beforeEach(() => {
    resetRefreshState()
    clearTokens()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    clearTokens()
    resetRefreshState()
    vi.unstubAllGlobals()
  })

  it('includes the access token on authenticated requests', async () => {
    const accessToken = createToken(3600)
    setTokens(accessToken, 'refresh-token')

    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await authFetch('http://localhost:3000/todos')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/todos',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )

    const [, requestInit] = vi.mocked(fetch).mock.calls[0]
    const headers = requestInit?.headers as Headers

    expect(headers.get('Authorization')).toBe(`Bearer ${accessToken}`)
  })

  it('refreshes expired access tokens and retries failed requests', async () => {
    const expiredToken = createToken(-60)
    const refreshedToken = createToken(3600)

    setTokens(expiredToken, 'refresh-token')

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: refreshedToken }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const response = await authFetch('http://localhost:3000/todos')

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/auth/refresh',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/todos',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )

    const [, retryInit] = vi.mocked(fetch).mock.calls[1]
    const retryHeaders = retryInit?.headers as Headers

    expect(retryHeaders.get('Authorization')).toBe(`Bearer ${refreshedToken}`)
  })

  it('retries with a refreshed token after a 401 response', async () => {
    const accessToken = createToken(3600)
    const refreshedToken = createToken(7200)

    setTokens(accessToken, 'refresh-token')

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: refreshedToken }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const response = await authFetch('http://localhost:3000/todos')

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
