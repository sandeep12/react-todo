import type { Db } from 'mongodb'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

import { createApp } from './app.js'

function createMockDb(): Db {
  return {
    command: vi.fn().mockResolvedValue({ ok: 1 }),
  } as unknown as Db
}

describe('createApp', () => {
  it('returns a healthy response from /health', async () => {
    const db = createMockDb()
    const app = createApp({ db })

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      service: 'api',
    })
    expect(db.command).toHaveBeenCalledWith({ ping: 1 })
  })
})
