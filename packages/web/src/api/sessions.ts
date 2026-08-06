import { authFetch } from '../auth/apiClient'
import { API_BASE_URL } from '../config'
import type { SessionSummary } from '../sessions/types'

export interface SessionsListResponse {
  sessions: SessionSummary[]
}

export interface SessionsApiError {
  error: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

export async function listSessions(): Promise<{
  response: Response
  data: SessionsListResponse | SessionsApiError
}> {
  const response = await authFetch(`${API_BASE_URL}/sessions`)
  const data = await parseJsonResponse<SessionsListResponse | SessionsApiError>(response)

  return { response, data }
}

export async function revokeSession(sessionId: string): Promise<Response> {
  return authFetch(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' })
}

export async function revokeAllSessions(): Promise<Response> {
  return authFetch(`${API_BASE_URL}/sessions`, { method: 'DELETE' })
}
