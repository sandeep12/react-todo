export interface ApiConfig {
  port: number
  mongoUri: string
  mongoDbName: string
}

function readRequiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number.parseInt(env.PORT ?? '3000', 10)

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('PORT must be a positive integer')
  }

  return {
    port,
    mongoUri: readRequiredEnv('MONGODB_URI', env),
    mongoDbName: env.MONGODB_DB_NAME?.trim() || 'todo_app',
  }
}
