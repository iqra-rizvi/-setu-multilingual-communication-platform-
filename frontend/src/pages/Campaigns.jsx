import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

const TYPE_COLORS = {
  awareness: 'text-teal border-teal/30 bg-teal/10',
  emergency: 'text-danger border-danger/30 bg-danger/10',
  education: 'text-violet border-violet/30 bg-violet/10',
  announcement: 'text-signal border-signal/30 bg-signal/10',
}

const STATUS_LABEL = {
  draft: 'Draft', scheduled: 'Scheduled', sending: 'Sending', completed: 'Completed',
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'awareness' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  function load() {
    api.get('/campaigns').then((res) => setCampaigns(res.data))
  }

  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/campaigns', {
        ...form,
        segment_filter: {},
        channels: [],
      })
      navigate(`/campaigns/${res.data.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Campaigns</h1>
          <p className="text-text-dim text-sm mt-1">
            Plan, generate, translate, and dispatch communication campaigns.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-signal text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition"
        >
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-xl p-5 mb-6 space-y-3">
          <div>
            <label className="text-[11px] text-text-dim block mb-1">Campaign name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
              placeholder="e.g. Monsoon Health Awareness Drive"
            />
          </div>
          <div>
            <label className="text-[11px] text-text-dim block mb-1">Description / brief</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
              placeholder="What is this campaign about? This will seed AI content generation."
            />
          </div>
          <div>
            <label className="text-[11px] text-text-dim block mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
            >
              {Object.keys(TYPE_COLORS).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create & continue →'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            to={`/campaigns/${c.id}`}
            className="bg-surface border border-border rounded-xl p-5 hover:border-violet/40 transition block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${TYPE_COLORS[c.type]}`}>
                {c.type}
              </span>
              <span className="text-[11px] text-text-dim">{STATUS_LABEL[c.status]}</span>
            </div>
            <h3 className="font-display font-semibold mb-1">{c.name}</h3>
            <p className="text-text-dim text-xs line-clamp-2">{c.description || 'No description provided.'}</p>
          </Link>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full text-center text-text-dim text-sm py-12 border border-dashed border-border rounded-xl">
            No campaigns yet. Create your first one above.
          </div>
        )}
      </div>
    </div>
  )
}
