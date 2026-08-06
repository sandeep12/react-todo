import { ObjectId, type Collection, type Db } from 'mongodb'

import { TODOS_COLLECTION } from '../db/collections.js'

export interface TodoDocument {
  _id: ObjectId
  userId: ObjectId
  title: string
  done: boolean
  createdAt: Date
}

export function getTodosCollection(db: Db): Collection<TodoDocument> {
  return db.collection<TodoDocument>(TODOS_COLLECTION)
}

export async function ensureTodoIndexes(db: Db): Promise<void> {
  await getTodosCollection(db).createIndex({ userId: 1, createdAt: -1 })
}
