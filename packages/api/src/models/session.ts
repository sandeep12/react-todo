import { ObjectId, type Collection, type Db } from 'mongodb'

import { SESSIONS_COLLECTION } from '../db/collections.js'

export interface SessionDocument {
  _id: ObjectId
  userId: ObjectId
  refreshTokenHash: string
  deviceLabel: string
  createdAt: Date
  lastActiveAt: Date
  revoked: boolean
}

export function getSessionsCollection(db: Db): Collection<SessionDocument> {
  return db.collection<SessionDocument>(SESSIONS_COLLECTION)
}

export async function ensureSessionIndexes(db: Db): Promise<void> {
  await getSessionsCollection(db).createIndex({ userId: 1 })
  await getSessionsCollection(db).createIndex({ refreshTokenHash: 1 })
}
