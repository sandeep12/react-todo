import { useAuth } from '../context/AuthContext'
import { SessionList } from './SessionList'
import { useSessions } from './useSessions'

export interface SessionsViewProps {
  loginPath?: string
  onSessionEnded?: () => void
}

export function SessionsView({ loginPath = '/login', onSessionEnded }: SessionsViewProps) {
  const { logout } = useAuth()
  const {
    sessions,
    loading,
    error,
    actionError,
    currentSessionId,
    revokeSession,
    logoutEverywhere,
    revokingId,
    isRevokingAll,
  } = useSessions()

  async function endSession() {
    logout()

    if (onSessionEnded) {
      onSessionEnded()
      return
    }

    window.location.assign(loginPath)
  }

  async function handleRevoke(sessionId: string) {
    const result = await revokeSession(sessionId)

    if (result === 'current') {
      await endSession()
    }
  }

  async function handleLogoutEverywhere() {
    const success = await logoutEverywhere()

    if (success) {
      await endSession()
    }
  }

  return (
    <div className="sessions-page">
      <header className="sessions-page__header">
        <h1>Active sessions</h1>
        <p>Review devices signed in to your account and revoke access when needed.</p>
      </header>

      {loading ? <p className="sessions-page__status">Loading sessions…</p> : null}

      {error ? (
        <p className="sessions-page__error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          revokingId={revokingId}
          onRevoke={(sessionId) => {
            void handleRevoke(sessionId)
          }}
        />
      ) : null}

      {actionError ? (
        <p className="sessions-page__error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="sessions-page__actions">
        <button
          type="button"
          className="sessions-page__logout-all"
          onClick={() => {
            void handleLogoutEverywhere()
          }}
          disabled={isRevokingAll || loading}
        >
          {isRevokingAll ? 'Logging out…' : 'Log out everywhere'}
        </button>
      </div>
    </div>
  )
}
