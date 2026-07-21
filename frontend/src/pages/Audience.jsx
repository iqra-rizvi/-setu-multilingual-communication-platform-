import React, { useEffect, useState } from 'react'
import api from '../services/api'

const EMPTY_FORM = {
  name: '', email: '', phone: '', language: 'English', state: '', city: '',
  occupation: '', organization: '', org_hierarchy: '',
}

export default function Audience() {
  const [recipients, setRecipients] = useState([])
  const [options, setOptions] = useState({ languages: [], states: [], cities: [], occupations: [], organizations: [] })
  const [filters, setFilters] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    const res = await api.get('/recipients', { params })
    setRecipients(res.data)
  }

  useEffect(() => {
    api.get('/recipients/segments/options').then((res) => setOptions(res.data))
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/recipients', form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await api.delete(`/recipients/${id}`)
    load()
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Audience</h1>
          <p className="text-text-dim text-sm mt-1">
            Segment recipients by language, geography, occupation, and organization.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-violet text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition"
        >
          {showForm ? 'Cancel' : '+ Add Recipient'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-surface border border-border rounded-xl p-5 mb-6 grid grid-cols-3 gap-3">
          {[
            ['name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'],
            ['state', 'State'], ['city', 'City'], ['occupation', 'Occupation'],
            ['organization', 'Organization'], ['org_hierarchy', 'Org hierarchy / level'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-[11px] text-text-dim block mb-1">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
                required={key === 'name'}
              />
            </div>
          ))}
          <div>
            <label className="text-[11px] text-text-dim block mb-1">Preferred language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
            >
              {['English', 'Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save recipient'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ['language', 'Language', options.languages],
          ['state', 'State', options.states],
          ['occupation', 'Occupation', options.occupations],
          ['organization', 'Organization', options.organizations],
        ].map(([key, label, values]) => (
          <select
            key={key}
            value={filters[key] || ''}
            onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-dim focus:border-violet outline-none"
          >
            <option value="">All {label}</option>
            {values.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({})}
            className="text-xs text-signal px-2 py-1.5"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-text-dim border-b border-border">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Occupation</th>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Engagement</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-text-dim text-xs">{r.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-surface-alt border border-border px-2 py-0.5 rounded-full">
                    {r.language}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-dim">{r.city}{r.city && r.state ? ', ' : ''}{r.state}</td>
                <td className="px-4 py-3 text-text-dim">{r.occupation}</td>
                <td className="px-4 py-3 text-text-dim">{r.organization}</td>
                <td className="px-4 py-3 font-mono text-teal">{r.engagement_score}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-xs text-text-dim hover:text-danger"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-dim text-sm">
                  No recipients match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
