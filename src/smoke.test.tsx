import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (smoke)', () => {
  it('mounts without crashing', () => {
    const { container } = render(<App />)

    expect(container.firstChild).not.toBeNull()
  })

  it('renders a top level heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
