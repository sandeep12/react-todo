export interface AuthConfig {
  jwtSecret: string
  accessTokenExpiresInSeconds: number
  refreshTokenExpiresInSeconds: number
}

function readRequiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function readPositiveIntEnv(
  name: string,
  fallback: number,
  env: NodeJS.ProcessEnv,
): number {
  const raw = env[name]?.trim()

  if (!raw) {
    return fallback
  }

  const value = Number.parseInt(raw, 10)

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return value
}

export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  return {
    jwtSecret: readRequiredEnv('JWT_SECRET', env),
    accessTokenExpiresInSeconds: readPositiveIntEnv(
      'JWT_ACCESS_EXPIRES_IN_SECONDS',
      900,
      env,
    ),
    refreshTokenExpiresInSeconds: readPositiveIntEnv(
      'JWT_REFRESH_EXPIRES_IN_SECONDS',
      60 * 60 * 24 * 7,
      env,
    ),
  }
}
