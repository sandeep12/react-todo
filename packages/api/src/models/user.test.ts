import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'

import {
  hashPassword,
  toUserPublic,
  userPublicProjection,
  verifyPassword,
  type UserDocument,
} from './user.js'

describe('User model', () => {
  it('stores a hashed password that can be verified', async () => {
    const password = 'secret-password'
    const passwordHash = await hashPassword(password)

    expect(passwordHash).not.toBe(password)
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', passwordHash)).resolves.toBe(false)
  })

  it('excludes passwordHash from public serialization', () => {
    const user: UserDocument = {
      _id: new ObjectId(),
      email: 'user@example.com',
      passwordHash: 'hashed-value',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }

    const publicUser = toUserPublic(user)

    expect(publicUser).toEqual({
      _id: user._id,
      email: 'user@example.com',
      createdAt: user.createdAt,
    })
    expect(publicUser).not.toHaveProperty('passwordHash')
    expect(publicUser).not.toHaveProperty('password')
  })

  it('defines a projection that omits sensitive fields', () => {
    expect(userPublicProjection).toEqual({
      _id: 1,
      email: 1,
      createdAt: 1,
    })
    expect(userPublicProjection).not.toHaveProperty('passwordHash')
  })
})
