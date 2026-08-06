import { ObjectId, type Db } from 'mongodb'

import { getTodosCollection, type TodoDocument } from '../../models/todo.js'

export class TodoError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_TITLE',
  ) {
    super(message)
    this.name = 'TodoError'
  }
}

export interface CreateTodoInput {
  title: string
}

export interface UpdateTodoInput {
  title?: string
  done?: boolean
}

export interface TodoPublic {
  id: string
  title: string
  done: boolean
  createdAt: string
  userId?: string
}

function toTodoPublic(todo: TodoDocument, includeUserId = false): TodoPublic {
  const result: TodoPublic = {
    id: todo._id.toHexString(),
    title: todo.title,
    done: todo.done,
    createdAt: todo.createdAt.toISOString(),
  }

  if (includeUserId) {
    result.userId = todo.userId.toHexString()
  }

  return result
}

function parseTodoId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) {
    return null
  }

  return new ObjectId(id)
}

export async function createTodo(
  db: Db,
  userId: ObjectId,
  input: CreateTodoInput,
): Promise<TodoPublic> {
  const title = input.title.trim()

  if (!title) {
    throw new TodoError('Title is required', 'INVALID_TITLE')
  }

  const createdAt = new Date()
  const result = await getTodosCollection(db).insertOne({
    userId,
    title,
    done: false,
    createdAt,
  } as unknown as TodoDocument)

  return toTodoPublic(
    {
      _id: result.insertedId,
      userId,
      title,
      done: false,
      createdAt,
    },
    true,
  )
}

export async function listTodos(db: Db, userId: ObjectId): Promise<TodoPublic[]> {
  const todos = await getTodosCollection(db)
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray()

  return todos.map((todo) => toTodoPublic(todo))
}

export async function updateTodo(
  db: Db,
  userId: ObjectId,
  todoId: string,
  input: UpdateTodoInput,
): Promise<TodoPublic> {
  const _id = parseTodoId(todoId)

  if (!_id) {
    throw new TodoError('Todo not found', 'NOT_FOUND')
  }

  const existing = await getTodosCollection(db).findOne({ _id })

  if (!existing) {
    throw new TodoError('Todo not found', 'NOT_FOUND')
  }

  if (!existing.userId.equals(userId)) {
    throw new TodoError('Todo not found', 'NOT_FOUND')
  }

  const updates: Partial<Pick<TodoDocument, 'title' | 'done'>> = {}

  if (input.title !== undefined) {
    const title = input.title.trim()

    if (!title) {
      throw new TodoError('Title cannot be empty', 'INVALID_TITLE')
    }

    updates.title = title
  }

  if (input.done !== undefined) {
    updates.done = input.done
  }

  if (Object.keys(updates).length === 0) {
    return toTodoPublic(existing)
  }

  await getTodosCollection(db).updateOne({ _id }, { $set: updates })

  return toTodoPublic({ ...existing, ...updates })
}

export async function deleteTodo(
  db: Db,
  userId: ObjectId,
  todoId: string,
): Promise<void> {
  const _id = parseTodoId(todoId)

  if (!_id) {
    throw new TodoError('Todo not found', 'NOT_FOUND')
  }

  const existing = await getTodosCollection(db).findOne({ _id })

  if (!existing || !existing.userId.equals(userId)) {
    throw new TodoError('Todo not found', 'NOT_FOUND')
  }

  await getTodosCollection(db).deleteOne({ _id })
}
