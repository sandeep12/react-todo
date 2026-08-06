import { MongoClient, type Db } from 'mongodb'

import type { ApiConfig } from '../config/index.js'
import { ensureSessionIndexes } from '../models/session.js'
import { ensureTodoIndexes } from '../models/todo.js'
import { ensureUserIndexes } from '../models/user.js'

export interface DatabaseConnection {
  client: MongoClient
  db: Db
}

export async function initializeDatabase(db: Db): Promise<void> {
  await Promise.all([
    ensureUserIndexes(db),
    ensureSessionIndexes(db),
    ensureTodoIndexes(db),
  ])
}

export async function connectToDatabase(config: ApiConfig): Promise<DatabaseConnection> {
  const client = new MongoClient(config.mongoUri)
  await client.connect()

  const db = client.db(config.mongoDbName)
  await initializeDatabase(db)

  return {
    client,
    db,
  }
}

export async function disconnectFromDatabase(connection: DatabaseConnection): Promise<void> {
  await connection.client.close()
}
