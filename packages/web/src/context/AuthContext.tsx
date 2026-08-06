import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { loginUser } from '../api/auth'
import { clearTokens, hasStoredTokens, setTokens } from '../auth/tokens'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasStoredTokens())

  const login = useCallback(async (email: string, password: string) => {
    const { response, data } = await loginUser(email, password)

    if (!response.ok || !('accessToken' in data)) {
      const message = 'error' in data ? data.error : 'Login failed'
      throw new Error(message)
    }

    setTokens(data.accessToken, data.refreshToken)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
