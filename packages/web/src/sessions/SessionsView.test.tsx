import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import { resetRefreshState } from '../auth/refresh'
import { clearTokens, setTokens } from '../auth/tokens'
import { SessionsView } from './SessionsView'

function createToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')

  return `${header}.${body}.signature`
}

describe('SessionsView', () => {
  beforeEach(() => {
    resetRefreshState()
    clearTokens()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('lists active sessions with device labels and last active times', async () => {
    const accessToken = createToken({ sid: 'session-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    setTokens(accessToken, 'refresh-token')

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sessions: [
            {
              id: 'session-1',
              deviceLabel: 'Phone',
              lastActiveAt: '2026-01-01T12:00:00.000Z',
            },
            {
              id: 'session-2',
              deviceLabel: 'Laptop',
              lastActiveAt: '2026-01-01T11:30:00.000Z',
            },
          ],
        }),
        { status: 200 },
      ),
    )

    render(
      <AuthProvider>
        <SessionsView />
      </AuthProvider>,
    )

    expect(await screen.findByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getAllByText(/last active/i)).toHaveLength(2)
    expect(screen.getByText('This device')).toBeInTheDocument()
  })

  it('revokes a single session and removes it from the list', async () => {
    const accessToken = createToken({ sid: 'session-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    setTokens(accessToken, 'refresh-token')

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sessions: [
              {
                id: 'session-1',
                deviceLabel: 'Phone',
                lastActiveAt: '2026-01-01T12:00:00.000Z',
              },
              {
                id: 'session-2',
                deviceLabel: 'Laptop',
                lastActiveAt: '2026-01-01T11:30:00.000Z',
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    render(
      <AuthProvider>
        <SessionsView />
      </AuthProvider>,
    )

    expect(await screen.findByText('Laptop')).toBeInTheDocument()

    const revokeButtons = screen.getAllByRole('button', { name: /^revoke$/i })
    await userEvent.click(revokeButtons[1])

    await waitFor(() => {
      expect(screen.queryByText('Laptop')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Phone')).toBeInTheDocument()
  })

  it('logs out everywhere and clears stored tokens', async () => {
    const accessToken = createToken({ sid: 'session-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    setTokens(accessToken, 'refresh-token')

    const onSessionEnded = vi.fn()

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sessions: [
              {
                id: 'session-1',
                deviceLabel: 'Phone',
                lastActiveAt: '2026-01-01T12:00:00.000Z',
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    render(
      <AuthProvider>
        <SessionsView onSessionEnded={onSessionEnded} />
      </AuthProvider>,
    )

    await screen.findByText('Phone')
    await userEvent.click(screen.getByRole('button', { name: /log out everywhere/i }))

    await waitFor(() => {
      expect(onSessionEnded).toHaveBeenCalled()
    })

    expect(localStorage.getItem('todo.accessToken')).toBeNull()
    expect(localStorage.getItem('todo.refreshToken')).toBeNull()
  })
})
