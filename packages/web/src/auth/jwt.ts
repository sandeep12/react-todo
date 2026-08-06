interface JwtPayload {
  exp?: number
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)

    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isAccessTokenExpired(token: string, bufferSeconds = 30): boolean {
  const payload = parseJwtPayload(token)

  if (!payload?.exp) {
    return true
  }

  return Date.now() >= (payload.exp - bufferSeconds) * 1000
}
