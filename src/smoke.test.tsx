import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App (smoke)', () => {
  it('renders the application heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /todo/i })).toBeInTheDocument()
  })

  it('renders a main landmark for the app content', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
