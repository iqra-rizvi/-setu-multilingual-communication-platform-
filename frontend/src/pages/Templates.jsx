import React, { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import api from '../services/api'

const TYPE_COLORS = {
  awareness: 'text-teal border-teal/30 bg-teal/10',
  emergency: 'text-danger border-danger/30 bg-danger/10',
  education: 'text-violet border-violet/30 bg-violet/10',
  announcement: 'text-signal border-signal/30 bg-signal/10',
}


export default function Templates() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'awareness', content: '', language: 'English' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  async function openTemplate(id) {
  try {
    const res = await api.get(`/templates/${id}`)
    setSelectedTemplate(res.data)
  } catch (error) {
    console.error("Failed to open template:", error)
  }
}

  async function load() {
  try {
    setLoading(true)
    setError("")

    const res = await api.get('/templates')

    console.log("Templates API response:", res.data)

    setTemplates(res.data)

  } catch (err) {
    setError("Failed to load templates")
    console.error("Template loading error:", err)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
  load()
}, [])

  async function handleCreate(e) {
  e.preventDefault()

  try {
    setSaving(true)

    await api.post('/templates/', form)

    setForm({
      name: '',
      category: 'awareness',
      content: '',
      language: 'English'
    })

    setShowForm(false)
    load()

  } catch (error) {
    console.error("Create template failed:", error)
  } finally {
    setSaving(false)
  }
}

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Templates</h1>
          <p className="text-text-dim text-sm mt-1">
            Reusable content library for common communication scenarios.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-violet text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-text-dim block mb-1">Template name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
                placeholder="e.g. Public Health Advisory"
              />
            </div>
            <div>
              <label className="text-[11px] text-text-dim block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
              >
                {Object.keys(TYPE_COLORS).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-text-dim block mb-1">Content</label>
            <textarea
              required
              rows={3}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
              placeholder="Reusable message text…"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </form>
      )}

{loading && (
  <p className="text-text-dim text-sm">Loading templates...</p>
)}

{error && (
  <p className="text-danger text-sm">{error}</p>
)}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div
  key={t.id}
  onClick={() => openTemplate(t.id)}
  className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-violet transition"
>
            <div className="flex items-center justify-between mb-3">
              <span
  className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${
    TYPE_COLORS[t.category] || 'text-gray-400 border-gray-400/30 bg-gray-400/10'
  }`}
>
                {t.category}
              </span>
              <span className="text-[11px] text-text-dim">{t.language}</span>
            </div>
            <h3 className="font-display font-semibold mb-2">{t.name}</h3>
            <p className="text-text-dim text-sm leading-relaxed">{t.content}</p>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full text-center text-text-dim text-sm py-12 border border-dashed border-border rounded-xl">
            No templates yet. Create your first one above.
          </div>
        )}
      </div>

      {selectedTemplate && (
  <div
  className="fixed inset-0 bg-black/50 flex items-center justify-center"
  onClick={() => setSelectedTemplate(null)}
>
    <div
 className="bg-surface rounded-xl p-6 w-[500px]"
 onClick={(e)=>e.stopPropagation()}
>
      <h2 className="text-xl font-semibold mb-3">
        {selectedTemplate.name}
      </h2>

      <p className="text-sm mb-3">
        Category: {selectedTemplate.category}
      </p>

      <p className="text-sm mb-3">
        Language: {selectedTemplate.language}
      </p>

      <p className="text-text-dim">
        {selectedTemplate.content}
      </p>

      <div className="mt-5 flex gap-3">
  <button
    onClick={() => {
      navigate(`/campaigns/create?template=${selectedTemplate.id}`)
    }}
    className="px-4 py-2 rounded bg-teal text-bg"
  >
    Use Template
  </button>

  <button
    onClick={() => setSelectedTemplate(null)}
    className="px-4 py-2 rounded bg-violet text-bg"
  >
    Close
  </button>
</div>
    </div>
  </div>
)}
    </div>
  )
}
