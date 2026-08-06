import { FormEvent, useState } from 'react'

import { useAuth } from '../context/AuthContext'

export interface LoginPageProps {
  onSuccess?: () => void
  registerPath?: string
  todosPath?: string
}

export default function LoginPage({
  onSuccess,
  registerPath = '/register',
  todosPath = '/todos',
}: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)

      if (onSuccess) {
        onSuccess()
      } else {
        window.location.assign(todosPath)
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Login failed'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-page__header">
        <h1>Sign in</h1>
        <p>Access your todos from any device.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-form__field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="auth-form__field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-page__footer">
        Need an account? <a href={registerPath}>Create one</a>
      </p>
    </div>
  )
}
