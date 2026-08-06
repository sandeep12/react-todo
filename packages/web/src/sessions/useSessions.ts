import { useCallback, useEffect, useState } from 'react'

import { listSessions, revokeAllSessions, revokeSession as revokeSessionApi } from '../api/sessions'
import { getCurrentSessionId } from './currentSession'
import type { SessionSummary } from './types'

export type RevokeSessionResult = 'current' | 'other' | 'failed'

export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  const currentSessionId = getCurrentSessionId()

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { response, data } = await listSessions()

      if (!response.ok) {
        const message = 'error' in data ? data.error : 'Failed to load sessions'
        setError(message)
        return
      }

      if ('sessions' in data) {
        setSessions(data.sessions)
      }
    } catch {
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const revokeSession = useCallback(
    async (sessionId: string): Promise<RevokeSessionResult> => {
      setActionError(null)
      setRevokingId(sessionId)

      try {
        const response = await revokeSessionApi(sessionId)

        if (!response.ok) {
          let message = 'Failed to revoke session'

          try {
            const data = (await response.json()) as { error?: string }
            if (data.error) {
              message = data.error
            }
          } catch {
            // Ignore empty error bodies from non-JSON responses.
          }

          setActionError(message)
          return 'failed'
        }

        if (sessionId === currentSessionId) {
          return 'current'
        }

        setSessions((previous) => previous.filter((session) => session.id !== sessionId))
        return 'other'
      } catch {
        setActionError('Failed to revoke session')
        return 'failed'
      } finally {
        setRevokingId(null)
      }
    },
    [currentSessionId],
  )

  const logoutEverywhere = useCallback(async (): Promise<boolean> => {
    setActionError(null)
    setIsRevokingAll(true)

    try {
      const response = await revokeAllSessions()

      if (!response.ok) {
        setActionError('Failed to log out everywhere')
        return false
      }

      return true
    } catch {
      setActionError('Failed to log out everywhere')
      return false
    } finally {
      setIsRevokingAll(false)
    }
  }, [])

  return {
    sessions,
    loading,
    error,
    actionError,
    currentSessionId,
    revokeSession,
    logoutEverywhere,
    revokingId,
    isRevokingAll,
    reload: loadSessions,
  }
}
