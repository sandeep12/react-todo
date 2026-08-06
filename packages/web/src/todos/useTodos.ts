import { useCallback, useEffect, useState } from 'react'

import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  type Todo,
} from '../api/todos'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTodos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchTodos()
      setTodos(data)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load todos'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTodos()
  }, [loadTodos])

  const addTodo = useCallback(async (title: string) => {
    const todo = await createTodo(title)
    setTodos((current) => [todo, ...current])
    return todo
  }, [])

  const editTodo = useCallback(async (id: string, input: { title?: string; done?: boolean }) => {
    const updated = await updateTodo(id, input)
    setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)))
    return updated
  }, [])

  const removeTodo = useCallback(async (id: string) => {
    await deleteTodo(id)
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }, [])

  return {
    todos,
    isLoading,
    error,
    loadTodos,
    addTodo,
    editTodo,
    removeTodo,
  }
}
