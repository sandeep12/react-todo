import { ObjectId, type Db } from 'mongodb'

import { getSessionsCollection } from '../../models/session.js'

export interface SessionSummary {
  id: string
  deviceLabel: string
  lastActiveAt: string
}

export class SessionError extends Error {
  constructor(
    message: string,
    readonly code: 'SESSION_NOT_FOUND',
  ) {
    super(message)
    this.name = 'SessionError'
  }
}

const ACTIVITY_UPDATE_INTERVAL_MS = 60_000

export async function listActiveSessions(
  db: Db,
  userId: ObjectId,
): Promise<SessionSummary[]> {
  const sessions = await getSessionsCollection(db)
    .find({ userId, revoked: false })
    .toArray()

  return sessions.map((session) => ({
    id: session._id.toHexString(),
    deviceLabel: session.deviceLabel,
    lastActiveAt: session.lastActiveAt.toISOString(),
  }))
}

export async function revokeSession(
  db: Db,
  userId: ObjectId,
  sessionId: string,
): Promise<void> {
  if (!ObjectId.isValid(sessionId)) {
    throw new SessionError('Session not found', 'SESSION_NOT_FOUND')
  }

  const result = await getSessionsCollection(db).updateOne(
    {
      _id: new ObjectId(sessionId),
      userId,
      revoked: false,
    },
    { $set: { revoked: true } },
  )

  if (result.matchedCount === 0) {
    throw new SessionError('Session not found', 'SESSION_NOT_FOUND')
  }
}

export async function revokeAllSessions(db: Db, userId: ObjectId): Promise<void> {
  await getSessionsCollection(db).updateMany(
    { userId, revoked: false },
    { $set: { revoked: true } },
  )
}

export async function touchSessionActivity(
  db: Db,
  userId: ObjectId,
  sessionId: ObjectId,
): Promise<void> {
  const session = await getSessionsCollection(db).findOne({
    _id: sessionId,
    userId,
    revoked: false,
  })

  if (!session) {
    return
  }

  const now = Date.now()

  if (now - session.lastActiveAt.getTime() < ACTIVITY_UPDATE_INTERVAL_MS) {
    return
  }

  await getSessionsCollection(db).updateOne(
    { _id: sessionId },
    { $set: { lastActiveAt: new Date(now) } },
  )
}

export function getSessionIdFromAccessToken(accessToken: string): ObjectId | null {
  const parts = accessToken.split('.')

  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { sid?: unknown }

    if (typeof payload.sid !== 'string' || !ObjectId.isValid(payload.sid)) {
      return null
    }

    return new ObjectId(payload.sid)
  } catch {
    return null
  }
}
