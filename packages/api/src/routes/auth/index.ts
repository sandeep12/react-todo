import { Router, type Request } from 'express'
import type { Db } from 'mongodb'

import {
  AuthError,
  loadAuthConfig,
  loginUser,
  refreshAccessToken,
  registerUser,
  type AuthConfig,
} from '../../services/auth/index.js'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getDeviceLabel(request: Request, bodyDeviceLabel: unknown): string {
  if (isNonEmptyString(bodyDeviceLabel)) {
    return bodyDeviceLabel.trim()
  }

  const userAgent = request.header('user-agent')?.trim()

  return userAgent || 'Unknown device'
}

function serializeUser(user: Awaited<ReturnType<typeof registerUser>>) {
  return {
    _id: user._id.toHexString(),
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  }
}

export function createAuthRouter(db: Db, config: AuthConfig = loadAuthConfig()): Router {
  const router = Router()

  router.post('/register', async (request, response) => {
    const { email, password } = request.body as {
      email?: unknown
      password?: unknown
    }

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      response.status(400).json({ error: 'Email and password are required' })
      return
    }

    try {
      const user = await registerUser(db, { email, password })
      response.status(201).json({ user: serializeUser(user) })
    } catch (error) {
      if (error instanceof AuthError && error.code === 'EMAIL_ALREADY_EXISTS') {
        response.status(409).json({ error: 'Email already registered' })
        return
      }

      throw error
    }
  })

  router.post('/login', async (request, response) => {
    const { email, password, deviceLabel } = request.body as {
      email?: unknown
      password?: unknown
      deviceLabel?: unknown
    }

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      response.status(400).json({ error: 'Email and password are required' })
      return
    }

    try {
      const tokens = await loginUser(db, config, {
        email,
        password,
        deviceLabel: getDeviceLabel(request, deviceLabel),
      })

      response.status(200).json(tokens)
    } catch (error) {
      if (error instanceof AuthError && error.code === 'INVALID_CREDENTIALS') {
        response.status(401).json({ error: 'Invalid credentials' })
        return
      }

      throw error
    }
  })

  router.post('/refresh', async (request, response) => {
    const { refreshToken } = request.body as { refreshToken?: unknown }

    if (!isNonEmptyString(refreshToken)) {
      response.status(400).json({ error: 'Refresh token is required' })
      return
    }

    try {
      const tokens = await refreshAccessToken(db, config, { refreshToken })
      response.status(200).json(tokens)
    } catch (error) {
      if (error instanceof AuthError && error.code === 'INVALID_CREDENTIALS') {
        response.status(401).json({ error: 'Invalid refresh token' })
        return
      }

      throw error
    }
  })

  return router
}
