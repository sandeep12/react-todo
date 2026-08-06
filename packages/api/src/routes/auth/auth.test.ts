import cors from 'cors'
import express from 'express'
import { MongoServerError, ObjectId, type Db, type Document } from 'mongodb'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { initializeDatabase } from '../../db/index.js'
import { createAuthenticateMiddleware } from '../../middleware/auth/index.js'
import { getSessionsCollection } from '../../models/session.js'
import { getUsersCollection } from '../../models/user.js'
import { createAuthRouter } from './index.js'

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

describe('auth routes', () => {
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
    app.get('/protected', createAuthenticateMiddleware(authConfig), (_request, response) => {
      response.status(200).json({ ok: true })
    })
  })

  it('registers a user and rejects duplicate emails', async () => {
    const first = await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    expect(first.status).toBe(201)
    expect(first.body.user).toMatchObject({
      email: 'user@example.com',
    })

    const storedUsers = await getUsersCollection(db).find().toArray()
    expect(storedUsers).toHaveLength(1)
    expect(storedUsers[0]?.email).toBe('user@example.com')

    const duplicate = await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'another-password' })

    expect(duplicate.status).toBe(409)
    expect(duplicate.body).toEqual({ error: 'Email already registered' })
  })

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    const login = await request(app)
      .post('/auth/login')
      .set('User-Agent', 'Vitest')
      .send({ email: 'user@example.com', password: 'secret-password' })

    expect(login.status).toBe(200)
    expect(login.body.accessToken).toEqual(expect.any(String))
    expect(login.body.refreshToken).toEqual(expect.any(String))

    const sessions = await getSessionsCollection(db).find().toArray()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({
      deviceLabel: 'Vitest',
      revoked: false,
    })
    expect(sessions[0]?.userId).toBeDefined()
    expect(sessions[0]?.refreshTokenHash).toEqual(expect.any(String))
    expect(sessions[0]?.createdAt).toBeInstanceOf(Date)
    expect(sessions[0]?.lastActiveAt).toBeInstanceOf(Date)

    const invalid = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'wrong-password' })

    expect(invalid.status).toBe(401)
    expect(invalid.body).toEqual({ error: 'Invalid credentials' })
  })

  it('rejects expired access tokens on protected routes', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    const shortLivedApp = express()
    shortLivedApp.use(express.json())
    shortLivedApp.use(
      '/auth',
      createAuthRouter(db, {
        ...authConfig,
        accessTokenExpiresInSeconds: 1,
      }),
    )
    shortLivedApp.get(
      '/protected',
      createAuthenticateMiddleware({
        ...authConfig,
        accessTokenExpiresInSeconds: 1,
      }),
      (_request, response) => {
        response.status(200).json({ ok: true })
      },
    )

    const login = await request(shortLivedApp)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secret-password' })

    const authorized = await request(shortLivedApp)
      .get('/protected')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(authorized.status).toBe(200)

    await new Promise((resolve) => {
      setTimeout(resolve, 1_100)
    })

    const expired = await request(shortLivedApp)
      .get('/protected')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(expired.status).toBe(401)
  })

  it('refreshes access tokens and rejects revoked or unknown refresh tokens', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    const login = await request(app)
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'secret-password',
        deviceLabel: 'Test device',
      })

    const sessionBeforeRefresh = await getSessionsCollection(db).findOne({})
    const lastActiveBefore = sessionBeforeRefresh?.lastActiveAt?.getTime() ?? 0
    expect(sessionBeforeRefresh?.lastActiveAt).toBeInstanceOf(Date)

    await new Promise((resolve) => {
      setTimeout(resolve, 1_100)
    })

    const refresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })

    expect(refresh.status).toBe(200)
    expect(refresh.body.accessToken).toEqual(expect.any(String))
    expect(refresh.body.accessToken).not.toBe(login.body.accessToken)

    const sessionAfterRefresh = await getSessionsCollection(db).findOne({})
    expect(sessionAfterRefresh?.lastActiveAt?.getTime()).toBeGreaterThan(lastActiveBefore)

    await getSessionsCollection(db).updateOne({}, { $set: { revoked: true } })

    const revoked = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })

    expect(revoked.status).toBe(401)

    const unknown = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'unknown-token' })

    expect(unknown.status).toBe(401)
  })
})
