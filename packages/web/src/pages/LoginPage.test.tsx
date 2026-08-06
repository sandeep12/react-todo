import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import LoginPage from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
  })

  it('stores tokens after a successful login', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        }),
        { status: 200 },
      ),
    )

    const onSuccess = vi.fn()

    render(
      <AuthProvider>
        <LoginPage onSuccess={onSuccess} />
      </AuthProvider>,
    )

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })

    expect(localStorage.getItem('todo.accessToken')).toBe('access-token')
    expect(localStorage.getItem('todo.refreshToken')).toBe('refresh-token')
  })

  it('shows an error for invalid credentials', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 }),
    )

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    )

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })
})
