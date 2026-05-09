import { createContext, useState, useEffect, useCallback } from 'react'
import { setAccessToken, clearAccessToken } from '../services/api'
import {
  loginUser as loginService,
  registerUser as registerService,
  logoutUser as logoutService,
  refreshAccessToken,
} from '../services/auth.service'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session via refresh token cookie
  useEffect(() => {
    let cancelled = false
    async function restoreSession() {
      try {
        const res = await refreshAccessToken()
        if (!cancelled && res.success) {
          setAccessToken(res.data.accessToken)
          setUser(res.data.user)
        }
      } catch {
        // No valid session — that's fine
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    restoreSession()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const res = await loginService({ email, password })
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    return res
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    const res = await registerService({ name, email, password })
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    return res
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } catch {
      // Even if the call fails, clear local state
    }
    clearAccessToken()
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
