import { formatLastActiveAt } from './formatLastActiveAt'
import type { SessionSummary } from './types'

export interface SessionListProps {
  sessions: SessionSummary[]
  currentSessionId: string | null
  revokingId: string | null
  onRevoke: (sessionId: string) => void
}

export function SessionList({
  sessions,
  currentSessionId,
  revokingId,
  onRevoke,
}: SessionListProps) {
  if (sessions.length === 0) {
    return <p className="sessions-page__empty">No active sessions.</p>
  }

  return (
    <ul className="sessions-list">
      {sessions.map((session) => {
        const isCurrent = session.id === currentSessionId
        const isRevoking = revokingId === session.id

        return (
          <li key={session.id} className="sessions-list__item">
            <div className="sessions-list__details">
              <p className="sessions-list__device">
                {session.deviceLabel}
                {isCurrent ? <span className="sessions-list__badge">This device</span> : null}
              </p>
              <p className="sessions-list__activity">
                Last active {formatLastActiveAt(session.lastActiveAt)}
              </p>
            </div>

            <button
              type="button"
              className="sessions-list__revoke"
              onClick={() => onRevoke(session.id)}
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking…' : 'Revoke'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
