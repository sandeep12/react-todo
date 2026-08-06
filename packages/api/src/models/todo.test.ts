import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'

import type { TodoDocument } from './todo.js'

describe('Todo model', () => {
  it('defines required todo fields', () => {
    const todo: TodoDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      title: 'Buy groceries',
      done: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }

    expect(todo.userId).toBeInstanceOf(ObjectId)
    expect(todo.title).toBe('Buy groceries')
    expect(todo.done).toBe(false)
    expect(todo.createdAt).toBeInstanceOf(Date)
  })
})
