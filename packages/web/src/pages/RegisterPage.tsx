import { FormEvent, useState } from 'react'

import { registerUser } from '../api/auth'

export interface RegisterPageProps {
  onSuccess?: () => void
  loginPath?: string
  todosPath?: string
  navigateToTodosOnSuccess?: boolean
}

export default function RegisterPage({
  onSuccess,
  loginPath = '/login',
  todosPath = '/todos',
  navigateToTodosOnSuccess = false,
}: RegisterPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { response, data } = await registerUser(email, password)

      if (!response.ok) {
        const message = 'error' in data ? data.error : 'Registration failed'
        setError(message)
        return
      }

      if (onSuccess) {
        onSuccess()
        return
      }

      window.location.assign(navigateToTodosOnSuccess ? todosPath : loginPath)
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-page__header">
        <h1>Create account</h1>
        <p>Register to start managing your todos.</p>
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
            autoComplete="new-password"
            required
            minLength={8}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-page__footer">
        Already have an account? <a href={loginPath}>Sign in</a>
      </p>
    </div>
  )
}
