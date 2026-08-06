import cors from 'cors'
import express, { type Express } from 'express'
import type { Db } from 'mongodb'

export interface CreateAppOptions {
  db: Db
}

export function createApp({ db }: CreateAppOptions): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', async (_request, response) => {
    await db.command({ ping: 1 })

    response.json({
      status: 'ok',
      service: 'api',
    })
  })

  return app
}
