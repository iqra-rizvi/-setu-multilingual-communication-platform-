import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('manager')
  const [password, setPassword] = useState('manager123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <span className="font-display font-semibold text-2xl">Setu</span>
        </div>
        <p className="text-center text-text-dim text-sm mb-8">
          Multilingual Mass Communication &amp; Public Awareness Platform
        </p>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-danger text-xs">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal text-bg font-medium text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-[11px] text-text-dim text-center pt-1">
            Demo accounts — admin / admin123 · manager / manager123
          </p>
        </form>
      </div>
    </div>
  )
}
