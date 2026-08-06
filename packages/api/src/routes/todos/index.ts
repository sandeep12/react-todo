import { Router } from 'express'
import type { Db } from 'mongodb'

import {
  createAuthenticateMiddleware,
  type AuthenticatedRequest,
} from '../../middleware/auth/index.js'
import { loadAuthConfig, type AuthConfig } from '../../services/auth/index.js'
import {
  TodoError,
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
} from '../../services/todos/index.js'

export function createTodosRouter(db: Db, config: AuthConfig = loadAuthConfig()): Router {
  const router = Router()
  const authenticate = createAuthenticateMiddleware(config)

  router.use(authenticate)

  router.post('/', async (request, response) => {
    const { userId } = request as AuthenticatedRequest
    const { title } = request.body as { title?: unknown }

    if (typeof title !== 'string') {
      response.status(400).json({ error: 'Title is required' })
      return
    }

    try {
      const todo = await createTodo(db, userId, { title })
      response.status(201).json(todo)
    } catch (error) {
      if (error instanceof TodoError && error.code === 'INVALID_TITLE') {
        response.status(400).json({ error: error.message })
        return
      }

      throw error
    }
  })

  router.get('/', async (request, response) => {
    const { userId } = request as AuthenticatedRequest
    const todos = await listTodos(db, userId)
    response.status(200).json(todos)
  })

  router.patch('/:id', async (request, response) => {
    const { userId } = request as unknown as AuthenticatedRequest
    const { id } = request.params
    const body = request.body as { title?: unknown; done?: unknown }

    const input: { title?: string; done?: boolean } = {}

    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        response.status(400).json({ error: 'Title must be a string' })
        return
      }

      input.title = body.title
    }

    if (body.done !== undefined) {
      if (typeof body.done !== 'boolean') {
        response.status(400).json({ error: 'Done must be a boolean' })
        return
      }

      input.done = body.done
    }

    try {
      const todo = await updateTodo(db, userId, id, input)
      response.status(200).json(todo)
    } catch (error) {
      if (error instanceof TodoError && error.code === 'NOT_FOUND') {
        response.status(404).json({ error: 'Todo not found' })
        return
      }

      if (error instanceof TodoError && error.code === 'INVALID_TITLE') {
        response.status(400).json({ error: error.message })
        return
      }

      throw error
    }
  })

  router.delete('/:id', async (request, response) => {
    const { userId } = request as unknown as AuthenticatedRequest
    const { id } = request.params

    try {
      await deleteTodo(db, userId, id)
      response.status(204).send()
    } catch (error) {
      if (error instanceof TodoError && error.code === 'NOT_FOUND') {
        response.status(404).json({ error: 'Todo not found' })
        return
      }

      throw error
    }
  })

  return router
}
