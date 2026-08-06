import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RegisterPage from './RegisterPage'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('shows an error when the email is already registered', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409 }),
    )

    render(<RegisterPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered')
  })

  it('calls onSuccess after a successful registration', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            _id: 'user-id',
            email: 'user@example.com',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        }),
        { status: 201 },
      ),
    )

    const onSuccess = vi.fn()

    render(<RegisterPage onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret-password')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(onSuccess).toHaveBeenCalled()
  })
})
