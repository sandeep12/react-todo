import 'dotenv/config'

import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { connectToDatabase, disconnectFromDatabase } from './db.js'

async function startServer(): Promise<void> {
  const config = loadConfig()
  const connection = await connectToDatabase(config)
  const app = createApp({ db: connection.db })

  const server = app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`)
  })

  const shutdown = async () => {
    server.close()
    await disconnectFromDatabase(connection)
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startServer().catch((error: unknown) => {
  console.error('Failed to start API server:', error)
  process.exit(1)
})
