import cors from 'cors'
import express from 'express'
import { MongoServerError, ObjectId, type Db, type Document } from 'mongodb'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initializeDatabase } from '../../db/index.js'
import {
  createAuthenticateMiddleware,
} from '../../middleware/auth/index.js'
import { getSessionsCollection } from '../../models/session.js'
import { getUsersCollection } from '../../models/user.js'
import { createAuthRouter } from '../auth/index.js'
import { createHmac } from 'node:crypto'

import { hashRefreshToken } from '../../services/auth/tokens.js'
import { createSessionActivityMiddleware } from '../../services/sessions/index.js'
import { createSessionsRouter } from './index.js'

interface InMemoryCollection {
  documents: Document[]
  indexes: Array<{ key: Record<string, number>; unique?: boolean }>
}

function matchesQuery(document: Document, query: Document): boolean {
  return Object.entries(query).every(([field, expected]) => {
    const actual = document[field]

    if (expected instanceof ObjectId) {
      return actual instanceof ObjectId && actual.equals(expected)
    }

    if (typeof expected === 'boolean') {
      return actual === expected
    }

    return actual === expected
  })
}

function createInMemoryDb(): Db {
  const collections = new Map<string, InMemoryCollection>()

  function getCollection(name: string): InMemoryCollection {
    const existing = collections.get(name)

    if (existing) {
      return existing
    }

    const created: InMemoryCollection = {
      documents: [],
      indexes: [],
    }
    collections.set(name, created)

    return created
  }

  return {
    collection(name: string) {
      const collection = getCollection(name)

      return {
        async insertOne(document: Document) {
          for (const index of collection.indexes) {
            if (!index.unique) {
              continue
            }

            const field = Object.keys(index.key)[0]
            const duplicate = collection.documents.some(
              (existing) => existing[field] === document[field],
            )

            if (duplicate) {
              const error = new MongoServerError('duplicate key error')
              error.code = 11000
              throw error
            }
          }

          const _id = new ObjectId()
          collection.documents.push({ ...document, _id })

          return { insertedId: _id, acknowledged: true }
        },
        async findOne(query: Document) {
          return collection.documents.find((document) => matchesQuery(document, query)) ?? null
        },
        async updateOne(query: Document, update: { $set?: Document }) {
          const document = collection.documents.find((entry) => matchesQuery(entry, query))

          if (!document || !update.$set) {
            return { matchedCount: document ? 1 : 0, modifiedCount: document ? 1 : 0 }
          }

          Object.assign(document, update.$set)

          return { matchedCount: 1, modifiedCount: 1 }
        },
        async updateMany(query: Document, update: { $set?: Document }) {
          const documents = collection.documents.filter((entry) => matchesQuery(entry, query))

          if (update.$set) {
            for (const document of documents) {
              Object.assign(document, update.$set)
            }
          }

          return { matchedCount: documents.length, modifiedCount: documents.length }
        },
        async deleteMany() {
          const deletedCount = collection.documents.length
          collection.documents = []

          return { deletedCount }
        },
        async createIndex(key: Record<string, number>, options?: { unique?: boolean }) {
          collection.indexes.push({ key, unique: options?.unique })
        },
        find(query: Document = {}) {
          const results = collection.documents.filter((document) => matchesQuery(document, query))

          return {
            async toArray() {
              return results
            },
          }
        },
      }
    },
    async command() {
      return { ok: 1 }
    },
  } as unknown as Db
}

function createAccessTokenWithSessionId(
  userId: ObjectId,
  sessionId: ObjectId,
  secret: string,
  expiresInSeconds: number,
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId.toHexString(),
      sid: sessionId.toHexString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  ).toString('base64url')
  const data = `${header}.${payload}`
  const signature = createHmac('sha256', secret).update(data).digest('base64url')

  return `${data}.${signature}`
}

describe('sessions routes', () => {
  let db: Db
  let app: express.Express

  const authConfig = {
    jwtSecret: 'test-jwt-secret',
    accessTokenExpiresInSeconds: 60,
    refreshTokenExpiresInSeconds: 60 * 60,
  }

  beforeEach(async () => {
    db = createInMemoryDb()
    await initializeDatabase(db)

    app = express()
    app.use(cors())
    app.use(express.json())
    app.use('/auth', createAuthRouter(db, authConfig))
    app.use(
      '/sessions',
      createSessionActivityMiddleware(db, authConfig),
      createSessionsRouter(db, authConfig),
    )
    app.get(
      '/protected',
      createSessionActivityMiddleware(db, authConfig),
      createAuthenticateMiddleware(authConfig),
      (_request, response) => {
        response.status(200).json({ ok: true })
      },
    )
  })

  async function registerAndLogin(
    email: string,
    password: string,
    deviceLabel: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    await request(app).post('/auth/register').send({ email, password })

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password, deviceLabel })

    return login.body
  }

  it('returns only non-revoked sessions for the authenticated user', async () => {
    const tokens = await registerAndLogin('user@example.com', 'secret-password', 'Phone')
    const user = await getUsersCollection(db).findOne({ email: 'user@example.com' })
    expect(user).toBeDefined()

    const secondSession = await getSessionsCollection(db).insertOne({
      userId: user!._id,
      refreshTokenHash: hashRefreshToken('second-refresh-token'),
      deviceLabel: 'Laptop',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      revoked: false,
    } as never)

    const sessionsInDb = await getSessionsCollection(db).find({ userId: user!._id }).toArray()
    const revokedSessionId = sessionsInDb[0]!._id
    await getSessionsCollection(db).updateOne(
      { _id: revokedSessionId },
      { $set: { revoked: true } },
    )

    const otherUserId = new ObjectId()
    await getSessionsCollection(db).insertOne({
      userId: otherUserId,
      refreshTokenHash: hashRefreshToken('other-user-token'),
      deviceLabel: 'Other user device',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      revoked: false,
    } as never)

    const response = await request(app)
      .get('/sessions')
      .set('Authorization', `Bearer ${tokens.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.sessions).toHaveLength(1)
    expect(response.body.sessions[0]).toEqual({
      id: secondSession.insertedId.toHexString(),
      deviceLabel: 'Laptop',
      lastActiveAt: expect.any(String),
    })
  })

  it('rejects unauthenticated session listing', async () => {
    const response = await request(app).get('/sessions')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Unauthorized' })
  })

  it('revokes a single session and blocks refresh for that token only', async () => {
    const first = await registerAndLogin('user@example.com', 'secret-password', 'Phone')
    const second = await registerAndLogin('user@example.com', 'secret-password', 'Laptop')

    const sessions = await getSessionsCollection(db).find({ revoked: false }).toArray()
    expect(sessions).toHaveLength(2)

    const sessionToRevoke = sessions.find((session) => session.deviceLabel === 'Phone')
    expect(sessionToRevoke).toBeDefined()

    const revoke = await request(app)
      .delete(`/sessions/${sessionToRevoke!._id.toHexString()}`)
      .set('Authorization', `Bearer ${second.accessToken}`)

    expect(revoke.status).toBe(204)

    const revokedRefresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: first.refreshToken })

    expect(revokedRefresh.status).toBe(401)

    const activeRefresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: second.refreshToken })

    expect(activeRefresh.status).toBe(200)
    expect(activeRefresh.body.accessToken).toEqual(expect.any(String))
  })

  it('revokes a session via POST /sessions/:sessionId/revoke', async () => {
    const tokens = await registerAndLogin('user@example.com', 'secret-password', 'Phone')
    const session = await getSessionsCollection(db).findOne({ deviceLabel: 'Phone' })
    expect(session).toBeDefined()

    const revoke = await request(app)
      .post(`/sessions/${session!._id.toHexString()}/revoke`)
      .set('Authorization', `Bearer ${tokens.accessToken}`)

    expect(revoke.status).toBe(204)

    const refresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })

    expect(refresh.status).toBe(401)
  })

  it('returns 404 when revoking an unknown session', async () => {
    const tokens = await registerAndLogin('user@example.com', 'secret-password', 'Phone')

    const response = await request(app)
      .delete(`/sessions/${new ObjectId().toHexString()}`)
      .set('Authorization', `Bearer ${tokens.accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'Session not found' })
  })

  it('revokes all sessions for the user via DELETE /sessions', async () => {
    const first = await registerAndLogin('user@example.com', 'secret-password', 'Phone')
    const second = await registerAndLogin('user@example.com', 'secret-password', 'Laptop')

    const logoutAll = await request(app)
      .delete('/sessions')
      .set('Authorization', `Bearer ${second.accessToken}`)

    expect(logoutAll.status).toBe(204)

    const firstRefresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: first.refreshToken })
    const secondRefresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: second.refreshToken })

    expect(firstRefresh.status).toBe(401)
    expect(secondRefresh.status).toBe(401)

    const sessions = await getSessionsCollection(db).find({}).toArray()
    expect(sessions.every((session) => session.revoked)).toBe(true)
  })

  it('updates lastActiveAt on authenticated requests at most once per minute', async () => {
    vi.useFakeTimers()

    try {
      const loginTime = new Date('2026-01-01T12:00:00.000Z')
      vi.setSystemTime(loginTime)

      await request(app)
        .post('/auth/register')
        .send({ email: 'user@example.com', password: 'secret-password' })

      const login = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'secret-password',
          deviceLabel: 'Phone',
        })

      const session = await getSessionsCollection(db).findOne({ deviceLabel: 'Phone' })
      expect(session).toBeDefined()

      const staleLastActiveAt = new Date('2026-01-01T11:58:00.000Z')
      await getSessionsCollection(db).updateOne(
        { _id: session!._id },
        { $set: { lastActiveAt: staleLastActiveAt } },
      )

      const accessToken = createAccessTokenWithSessionId(
        session!.userId,
        session!._id,
        authConfig.jwtSecret,
        3600,
      )

      const firstRequestTime = new Date('2026-01-01T12:00:00.000Z')
      vi.setSystemTime(firstRequestTime)

      const first = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(first.status).toBe(200)

      const afterFirst = await getSessionsCollection(db).findOne({ _id: session!._id })
      expect(afterFirst?.lastActiveAt?.toISOString()).toBe(firstRequestTime.toISOString())

      vi.setSystemTime(new Date('2026-01-01T12:00:30.000Z'))

      await request(app).get('/protected').set('Authorization', `Bearer ${accessToken}`)

      const afterSecond = await getSessionsCollection(db).findOne({ _id: session!._id })
      expect(afterSecond?.lastActiveAt?.toISOString()).toBe(firstRequestTime.toISOString())

      const thirdRequestTime = new Date('2026-01-01T12:01:01.000Z')
      vi.setSystemTime(thirdRequestTime)

      await request(app).get('/protected').set('Authorization', `Bearer ${accessToken}`)

      const afterThird = await getSessionsCollection(db).findOne({ _id: session!._id })
      expect(afterThird?.lastActiveAt?.toISOString()).toBe(thirdRequestTime.toISOString())

      const list = await request(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(list.status).toBe(200)
      expect(list.body.sessions[0]?.lastActiveAt).toBe(thirdRequestTime.toISOString())
    } finally {
      vi.useRealTimers()
    }
  })
})
