import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'

import type { SessionDocument } from './session.js'

describe('Session model', () => {
  it('defines required session fields', () => {
    const session: SessionDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      refreshTokenHash: 'hashed-refresh-token',
      deviceLabel: 'Chrome on macOS',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastActiveAt: new Date('2026-01-02T00:00:00.000Z'),
      revoked: false,
    }

    expect(session.userId).toBeInstanceOf(ObjectId)
    expect(session.refreshTokenHash).toBe('hashed-refresh-token')
    expect(session.deviceLabel).toBe('Chrome on macOS')
    expect(session.createdAt).toBeInstanceOf(Date)
    expect(session.lastActiveAt).toBeInstanceOf(Date)
    expect(session.revoked).toBe(false)
  })
})
