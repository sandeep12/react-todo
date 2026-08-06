import cors from 'cors'
import express from 'express'
import { MongoServerError, ObjectId, type Db, type Document } from 'mongodb'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { initializeDatabase } from '../../db/index.js'
import { getTodosCollection } from '../../models/todo.js'
import { createAuthRouter } from '../auth/index.js'
import { createTodosRouter } from './index.js'

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
        async deleteOne(query: Document) {
          const index = collection.documents.findIndex((entry) => matchesQuery(entry, query))

          if (index === -1) {
            return { deletedCount: 0 }
          }

          collection.documents.splice(index, 1)

          return { deletedCount: 1 }
        },
        async createIndex(key: Record<string, number>, options?: { unique?: boolean }) {
          collection.indexes.push({ key, unique: options?.unique })
        },
        find(query: Document = {}) {
          const results = collection.documents.filter((document) => matchesQuery(document, query))

          return {
            sort(sort: Record<string, 1 | -1>) {
              const [[field, direction]] = Object.entries(sort)

              results.sort((left, right) => {
                const leftValue = left[field] as Date
                const rightValue = right[field] as Date
                const comparison = leftValue.getTime() - rightValue.getTime()

                return direction === -1 ? -comparison : comparison
              })

              return {
                async toArray() {
                  return results
                },
              }
            },
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

async function login(app: express.Express, email: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/auth/login')
    .send({ email, password })

  return response.body.accessToken as string
}

describe('todo routes', () => {
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
    app.use('/todos', createTodosRouter(db, authConfig))
  })

  it('creates a todo with a valid token and rejects missing tokens or empty titles', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    const unauthorized = await request(app).post('/todos').send({ title: 'Buy milk' })

    expect(unauthorized.status).toBe(401)
    expect(unauthorized.body).toEqual({ error: 'Unauthorized' })

    const token = await login(app, 'user@example.com', 'secret-password')

    const created = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy milk' })

    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      title: 'Buy milk',
      done: false,
      userId: expect.any(String),
    })
    expect(created.body.id).toEqual(expect.any(String))
    expect(created.body.createdAt).toEqual(expect.any(String))

    const emptyTitle = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '   ' })

    expect(emptyTitle.status).toBe(400)
    expect(emptyTitle.body).toEqual({ error: 'Title is required' })
  })

  it('lists only the authenticated user todos', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    await request(app)
      .post('/auth/register')
      .send({ email: 'other@example.com', password: 'secret-password' })

    const token = await login(app, 'user@example.com', 'secret-password')
    const otherToken = await login(app, 'other@example.com', 'secret-password')

    await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My todo' })

    await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Other todo' })

    const response = await request(app)
      .get('/todos')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toMatchObject({
      title: 'My todo',
      done: false,
    })
    expect(response.body[0]).toHaveProperty('id')
    expect(response.body[0]).toHaveProperty('createdAt')
    expect(response.body[0]).not.toHaveProperty('userId')
  })

  it('updates title or done flag and rejects other users or missing todos', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    await request(app)
      .post('/auth/register')
      .send({ email: 'other@example.com', password: 'secret-password' })

    const token = await login(app, 'user@example.com', 'secret-password')
    const otherToken = await login(app, 'other@example.com', 'secret-password')

    const created = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original title' })

    const updatedTitle = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' })

    expect(updatedTitle.status).toBe(200)
    expect(updatedTitle.body).toMatchObject({
      id: created.body.id,
      title: 'Updated title',
      done: false,
    })

    const updatedDone = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ done: true })

    expect(updatedDone.status).toBe(200)
    expect(updatedDone.body.done).toBe(true)

    const missing = await request(app)
      .patch('/todos/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Missing' })

    expect(missing.status).toBe(404)

    const forbidden = await request(app)
      .patch(`/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Stolen' })

    expect([403, 404]).toContain(forbidden.status)
  })

  it('deletes a todo and rejects other users or missing todos', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'secret-password' })

    await request(app)
      .post('/auth/register')
      .send({ email: 'other@example.com', password: 'secret-password' })

    const token = await login(app, 'user@example.com', 'secret-password')
    const otherToken = await login(app, 'other@example.com', 'secret-password')

    const created = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To delete' })

    const deleted = await request(app)
      .delete(`/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect([200, 204]).toContain(deleted.status)
    expect(await getTodosCollection(db).findOne({ _id: new ObjectId(created.body.id) })).toBeNull()

    const missing = await request(app)
      .delete('/todos/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)

    expect(missing.status).toBe(404)

    const otherCreated = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Protected' })

    const forbidden = await request(app)
      .delete(`/todos/${otherCreated.body.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect([403, 404]).toContain(forbidden.status)
  })
})
