import { render, screen } from '@testing-library/react'
import App from './App'

describe('App (smoke test)', () => {
  it('renders the application heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /todo app/i })).toBeInTheDocument()
  })

  it('renders a main landmark', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
