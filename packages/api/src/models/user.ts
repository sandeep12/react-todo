import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import { ObjectId, type Collection, type Db } from 'mongodb'

import { USERS_COLLECTION } from '../db/collections.js'

const scryptAsync = promisify(scrypt)

export interface UserDocument {
  _id: ObjectId
  email: string
  passwordHash: string
  createdAt: Date
}

export interface UserPublic {
  _id: ObjectId
  email: string
  createdAt: Date
}

export const userPublicProjection = {
  _id: 1,
  email: 1,
  createdAt: 1,
} as const

export function getUsersCollection(db: Db): Collection<UserDocument> {
  return db.collection<UserDocument>(USERS_COLLECTION)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer

  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const [salt, key] = passwordHash.split(':')

  if (!salt || !key) {
    return false
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  const keyBuffer = Buffer.from(key, 'hex')

  if (derivedKey.length !== keyBuffer.length) {
    return false
  }

  return timingSafeEqual(derivedKey, keyBuffer)
}

export function toUserPublic(user: UserDocument): UserPublic {
  return {
    _id: user._id,
    email: user.email,
    createdAt: user.createdAt,
  }
}

export async function ensureUserIndexes(db: Db): Promise<void> {
  await getUsersCollection(db).createIndex({ email: 1 }, { unique: true })
}
