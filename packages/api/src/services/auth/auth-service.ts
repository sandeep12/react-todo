import { MongoServerError, ObjectId, type Db } from 'mongodb'

import { getSessionsCollection, type SessionDocument } from '../../models/session.js'
import {
  getUsersCollection,
  hashPassword,
  toUserPublic,
  verifyPassword,
  type UserDocument,
  type UserPublic,
} from '../../models/user.js'
import { type AuthConfig } from './config.js'
import { createAccessToken, verifyAccessToken } from './jwt.js'
import { generateRefreshToken, hashRefreshToken } from './tokens.js'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
  deviceLabel: string
}

export interface RefreshInput {
  refreshToken: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_CREDENTIALS' | 'EMAIL_ALREADY_EXISTS',
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function registerUser(
  db: Db,
  input: RegisterInput,
): Promise<UserPublic> {
  const email = normalizeEmail(input.email)
  const createdAt = new Date()

  try {
    const result = await getUsersCollection(db).insertOne({
      email,
      passwordHash: await hashPassword(input.password),
      createdAt,
    } as unknown as UserDocument)

    return toUserPublic({
      _id: result.insertedId,
      email,
      passwordHash: '',
      createdAt,
    })
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new AuthError('Email already registered', 'EMAIL_ALREADY_EXISTS')
    }

    throw error
  }
}

export async function loginUser(
  db: Db,
  config: AuthConfig,
  input: LoginInput,
): Promise<AuthTokens> {
  const email = normalizeEmail(input.email)
  const user = await getUsersCollection(db).findOne({ email })

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
  }

  const refreshToken = generateRefreshToken()
  const now = new Date()

  await getSessionsCollection(db).insertOne({
    userId: user._id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    deviceLabel: input.deviceLabel,
    createdAt: now,
    lastActiveAt: now,
    revoked: false,
  } as unknown as SessionDocument)

  return {
    accessToken: createAccessToken(
      user._id.toHexString(),
      config.jwtSecret,
      config.accessTokenExpiresInSeconds,
    ),
    refreshToken,
  }
}

export async function refreshAccessToken(
  db: Db,
  config: AuthConfig,
  input: RefreshInput,
): Promise<{ accessToken: string }> {
  const refreshTokenHash = hashRefreshToken(input.refreshToken)
  const session = await getSessionsCollection(db).findOne({ refreshTokenHash })

  if (!session || session.revoked) {
    throw new AuthError('Invalid refresh token', 'INVALID_CREDENTIALS')
  }

  const lastActiveAt = new Date()

  await getSessionsCollection(db).updateOne(
    { _id: session._id },
    { $set: { lastActiveAt } },
  )

  return {
    accessToken: createAccessToken(
      session.userId.toHexString(),
      config.jwtSecret,
      config.accessTokenExpiresInSeconds,
    ),
  }
}

export function getUserIdFromAccessToken(
  accessToken: string,
  config: AuthConfig,
): ObjectId | null {
  const payload = verifyAccessToken(accessToken, config.jwtSecret)

  if (!payload) {
    return null
  }

  return new ObjectId(payload.sub)
}
