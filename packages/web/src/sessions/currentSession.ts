import { parseJwtPayload } from '../auth/jwt'
import { getAccessToken } from '../auth/tokens'

export function getCurrentSessionId(): string | null {
  const accessToken = getAccessToken()

  if (!accessToken) {
    return null
  }

  const payload = parseJwtPayload(accessToken) as { sid?: string } | null

  return typeof payload?.sid === 'string' ? payload.sid : null
}
