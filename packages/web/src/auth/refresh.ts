import { refreshAccessToken } from '../api/auth'
import { clearTokens, getRefreshToken, setAccessToken } from './tokens'

let refreshInFlight: Promise<string | null> | null = null

export async function refreshStoredAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      clearTokens()
      return null
    }

    try {
      const { response, data } = await refreshAccessToken(refreshToken)

      if (!response.ok || !('accessToken' in data)) {
        clearTokens()
        return null
      }

      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      clearTokens()
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export function resetRefreshState(): void {
  refreshInFlight = null
}
