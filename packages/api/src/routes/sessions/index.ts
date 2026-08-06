import { Router } from 'express'
import type { Db } from 'mongodb'

import {
  createAuthenticateMiddleware,
  type AuthenticatedRequest,
} from '../../middleware/auth/index.js'
import { loadAuthConfig, type AuthConfig } from '../../services/auth/index.js'
import {
  SessionError,
  listActiveSessions,
  revokeAllSessions,
  revokeSession,
} from '../../services/sessions/index.js'

export function createSessionsRouter(db: Db, config: AuthConfig = loadAuthConfig()): Router {
  const router = Router()
  const authenticate = createAuthenticateMiddleware(config)

  router.get('/', authenticate, async (request, response) => {
    const { userId } = request as AuthenticatedRequest
    const sessions = await listActiveSessions(db, userId)

    response.status(200).json({ sessions })
  })

  router.delete('/', authenticate, async (request, response) => {
    const { userId } = request as AuthenticatedRequest

    await revokeAllSessions(db, userId)
    response.status(204).send()
  })

  router.delete('/:sessionId', authenticate, async (request, response) => {
    const { userId } = request as AuthenticatedRequest
    const sessionId = String(request.params.sessionId)

    try {
      await revokeSession(db, userId, sessionId)
      response.status(204).send()
    } catch (error) {
      if (error instanceof SessionError && error.code === 'SESSION_NOT_FOUND') {
        response.status(404).json({ error: 'Session not found' })
        return
      }

      throw error
    }
  })

  router.post('/:sessionId/revoke', authenticate, async (request, response) => {
    const { userId } = request as AuthenticatedRequest
    const sessionId = String(request.params.sessionId)

    try {
      await revokeSession(db, userId, sessionId)
      response.status(204).send()
    } catch (error) {
      if (error instanceof SessionError && error.code === 'SESSION_NOT_FOUND') {
        response.status(404).json({ error: 'Session not found' })
        return
      }

      throw error
    }
  })

  return router
}
