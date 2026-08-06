import { createHmac, timingSafeEqual } from 'node:crypto'

export interface AccessTokenPayload {
  sub: string
  iat: number
  exp: number
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url')
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function createAccessToken(
  userId: string,
  secret: string,
  expiresInSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      iat: nowSeconds,
      exp: nowSeconds + expiresInSeconds,
    }),
  )
  const data = `${header}.${payload}`

  return `${data}.${sign(data, secret)}`
}

export function verifyAccessToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): AccessTokenPayload | null {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  const [header, payload, signature] = parts
  const data = `${header}.${payload}`
  const expectedSignature = sign(data, secret)
  const signatureBuffer = base64UrlDecode(signature)
  const expectedBuffer = base64UrlDecode(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  let parsedPayload: AccessTokenPayload

  try {
    parsedPayload = JSON.parse(base64UrlDecode(payload).toString('utf8')) as AccessTokenPayload
  } catch {
    return null
  }

  if (
    typeof parsedPayload.sub !== 'string' ||
    typeof parsedPayload.exp !== 'number' ||
    typeof parsedPayload.iat !== 'number'
  ) {
    return null
  }

  if (parsedPayload.exp <= nowSeconds) {
    return null
  }

  return parsedPayload
}
