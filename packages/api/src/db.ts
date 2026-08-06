import { MongoClient, type Db } from 'mongodb'

import type { ApiConfig } from './config.js'

export interface DatabaseConnection {
  client: MongoClient
  db: Db
}

export async function connectToDatabase(config: ApiConfig): Promise<DatabaseConnection> {
  const client = new MongoClient(config.mongoUri)
  await client.connect()

  return {
    client,
    db: client.db(config.mongoDbName),
  }
}

export async function disconnectFromDatabase(connection: DatabaseConnection): Promise<void> {
  await connection.client.close()
}
