import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, registerUser, fetchMe } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ato_shield_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ato_shield_token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then((me) => {
        setUser(me)
        localStorage.setItem('ato_shield_user', JSON.stringify(me))
      })
      .catch(() => {
        localStorage.removeItem('ato_shield_token')
        localStorage.removeItem('ato_shield_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials)
    localStorage.setItem('ato_shield_token', data.token)
    localStorage.setItem('ato_shield_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload)
    localStorage.setItem('ato_shield_token', data.token)
    localStorage.setItem('ato_shield_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ato_shield_token')
    localStorage.removeItem('ato_shield_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
