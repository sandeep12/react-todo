import { API_BASE_URL } from '../config'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  user: {
    _id: string
    email: string
    createdAt: string
  }
}

export interface AuthApiError {
  error: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

export async function registerUser(
  email: string,
  password: string,
): Promise<{ response: Response; data: RegisterResponse | AuthApiError }> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await parseJsonResponse<RegisterResponse | AuthApiError>(response)

  return { response, data }
}

export async function loginUser(
  email: string,
  password: string,
  deviceLabel?: string,
): Promise<{ response: Response; data: AuthTokens | AuthApiError }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      deviceLabel: deviceLabel ?? navigator.userAgent,
    }),
  })

  const data = await parseJsonResponse<AuthTokens | AuthApiError>(response)

  return { response, data }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ response: Response; data: { accessToken: string } | AuthApiError }> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const data = await parseJsonResponse<{ accessToken: string } | AuthApiError>(response)

  return { response, data }
}
