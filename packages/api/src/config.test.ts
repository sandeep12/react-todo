import { describe, expect, it } from 'vitest'

import { loadConfig } from './config.js'

describe('loadConfig', () => {
  it('reads MongoDB settings and port from environment variables', () => {
    const config = loadConfig({
      PORT: '4000',
      MONGODB_URI: 'mongodb://localhost:27017',
      MONGODB_DB_NAME: 'todos',
    })

    expect(config).toEqual({
      port: 4000,
      mongoUri: 'mongodb://localhost:27017',
      mongoDbName: 'todos',
    })
  })

  it('throws when MONGODB_URI is missing', () => {
    expect(() => loadConfig({ PORT: '3000' })).toThrow(/MONGODB_URI/)
  })
})
