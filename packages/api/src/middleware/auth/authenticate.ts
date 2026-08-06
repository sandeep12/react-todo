import type { NextFunction, Request, Response } from 'express'
import type { ObjectId } from 'mongodb'

import { getUserIdFromAccessToken, type AuthConfig } from '../../services/auth/index.js'

export interface AuthenticatedRequest extends Request {
  userId: ObjectId
}

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

export function createAuthenticateMiddleware(config: AuthConfig) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const token = getBearerToken(request.header('authorization'))

    if (!token) {
      response.status(401).json({ error: 'Unauthorized' })
      return
    }

    const userId = getUserIdFromAccessToken(token, config)

    if (!userId) {
      response.status(401).json({ error: 'Unauthorized' })
      return
    }

    ;(request as AuthenticatedRequest).userId = userId
    next()
  }
}
