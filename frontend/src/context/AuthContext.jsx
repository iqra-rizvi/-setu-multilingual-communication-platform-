import React, { createContext, useContext, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('setu_user')
    return stored ? JSON.parse(stored) : null
  })

  async function login(username, password) {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const res = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('setu_token', res.data.access_token)
    localStorage.setItem('setu_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  function logout() {
    localStorage.removeItem('setu_token')
    localStorage.removeItem('setu_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
