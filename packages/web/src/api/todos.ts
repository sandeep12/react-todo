import { authFetch } from '../auth/apiClient'
import { API_BASE_URL } from '../config'

export interface Todo {
  id: string
  title: string
  done: boolean
  createdAt: string
}

interface TodosApiError {
  error: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await parseJsonResponse<T | TodosApiError>(response)

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data ? data.error : 'Request failed'
    throw new Error(message)
  }

  return data as T
}

export async function fetchTodos(): Promise<Todo[]> {
  const response = await authFetch(`${API_BASE_URL}/todos`)
  return handleResponse<Todo[]>(response)
}

export async function createTodo(title: string): Promise<Todo> {
  const response = await authFetch(`${API_BASE_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })

  return handleResponse<Todo>(response)
}

export async function updateTodo(
  id: string,
  input: { title?: string; done?: boolean },
): Promise<Todo> {
  const response = await authFetch(`${API_BASE_URL}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return handleResponse<Todo>(response)
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/todos/${id}`, {
    method: 'DELETE',
  })

  await handleResponse<void>(response)
}
