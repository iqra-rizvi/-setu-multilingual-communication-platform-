import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', role: 'comms_team', organization: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different username or email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1 justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <span className="font-display font-semibold text-2xl">Setu</span>
        </div>
        <p className="text-center text-text-dim text-sm mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Password</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Organization</label>
            <input
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
              placeholder="e.g. Dept. of Public Communication"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim block mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm focus:border-violet outline-none"
            >
              <option value="comms_team">Comms Team</option>
              <option value="campaign_manager">Campaign Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div className="text-danger text-xs">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal text-bg font-medium text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-[11px] text-text-dim text-center pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-violet hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
