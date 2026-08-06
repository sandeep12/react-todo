import { isAccessTokenExpired } from './jwt'
import { refreshStoredAccessToken } from './refresh'
import { getAccessToken } from './tokens'

export interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean
}

async function resolveAccessToken(): Promise<string | null> {
  let accessToken = getAccessToken()

  if (!accessToken) {
    return null
  }

  if (isAccessTokenExpired(accessToken)) {
    accessToken = await refreshStoredAccessToken()
  }

  return accessToken
}

function withAuthorization(headers: HeadersInit | undefined, accessToken: string | null): Headers {
  const nextHeaders = new Headers(headers)

  if (accessToken) {
    nextHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  return nextHeaders
}

export async function authFetch(input: RequestInfo | URL, options: AuthFetchOptions = {}): Promise<Response> {
  const { skipAuth = false, headers, ...rest } = options

  if (skipAuth) {
    return fetch(input, { ...rest, headers })
  }

  let accessToken = await resolveAccessToken()
  let response = await fetch(input, {
    ...rest,
    headers: withAuthorization(headers, accessToken),
  })

  if (response.status === 401 && getAccessToken()) {
    const refreshedToken = await refreshStoredAccessToken()

    if (refreshedToken) {
      accessToken = refreshedToken
      response = await fetch(input, {
        ...rest,
        headers: withAuthorization(headers, accessToken),
      })
    }
  }

  return response
}
