import type { NextFunction, Request, Response } from 'express'
import type { Db } from 'mongodb'

import { getUserIdFromAccessToken, type AuthConfig } from '../auth/index.js'
import { getSessionIdFromAccessToken, touchSessionActivity } from './session-service.js'

function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export function createSessionActivityMiddleware(db: Db, config: AuthConfig) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const token = getBearerToken(request.header('authorization'))

    if (!token) {
      next()
      return
    }

    const userId = getUserIdFromAccessToken(token, config)
    const sessionId = getSessionIdFromAccessToken(token)

    if (!userId || !sessionId) {
      next()
      return
    }

    void touchSessionActivity(db, userId, sessionId)
      .catch(() => undefined)
      .finally(() => {
        next()
      })
  }
}
