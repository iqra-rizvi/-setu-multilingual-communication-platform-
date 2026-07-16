import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

const LANGUAGES = ['Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia']
const CHANNELS = ['email', 'sms', 'whatsapp', 'push', 'web']
const TONES = ['informative', 'urgent', 'friendly', 'formal']

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [contents, setContents] = useState([])
  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState('informative')
  const [targetLangs, setTargetLangs] = useState(['Hindi', 'Tamil', 'Bengali'])
  const [selectedChannels, setSelectedChannels] = useState(['email', 'sms'])
  const [generating, setGenerating] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [sending, setSending] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [status, setStatus] = useState(null)
  const [sampleMessages, setSampleMessages] = useState([])
  const [recipientMap, setRecipientMap] = useState({})

  function load() {
    api.get(`/campaigns/${id}`).then((res) => setCampaign(res.data))
    api.get(`/ai/content/${id}`).then((res) => setContents(res.data))
    api.get(`/distribution/status/${id}`).then((res) => setStatus(res.data)).catch(() => {})
    api.get(`/distribution/messages/${id}`, { params: { limit: 5 } }).then((res) => setSampleMessages(res.data)).catch(() => {})
    api.get(`/analytics/campaign/${id}`).then((res) => setAnalytics(res.data)).catch(() => {})
    api.get('/recipients').then((res) => {
      const map = {}
      res.data.forEach((r) => { map[r.id] = r.name })
      setRecipientMap(map)
    })
  }

  useEffect(() => {
    load()
    setBrief((c) => c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (campaign?.description) setBrief(campaign.description)
  }, [campaign])

  const englishContent = contents.find((c) => c.language === 'English')

  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    try {
      await api.post('/ai/generate-content', { campaign_id: id, brief, tone })
      load()
    } finally {
      setGenerating(false)
    }
  }

  async function handleTranslate() {
    if (!englishContent) return
    setTranslating(true)
    try {
      await api.post('/ai/translate', {
        campaign_id: id,
        source_content: englishContent.content,
        tone,
        target_languages: targetLangs,
      })
      load()
    } finally {
      setTranslating(false)
    }
  }

  async function handleSend() {
    setSending(true)
    try {
      await api.post('/distribution/send', { campaign_id: id, channels: selectedChannels })
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  if (!campaign) return <div className="text-text-dim text-sm">Loading campaign…</div>

  return (
    <div className="max-w-5xl">
      <header className="mb-7">
        <div className="flex items-center gap-2 text-[11px] text-text-dim mb-2">
          <span className="capitalize px-2 py-0.5 rounded-full border border-border">{campaign.type}</span>
          <span className="capitalize">{campaign.status}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold">{campaign.name}</h1>
        <p className="text-text-dim text-sm mt-1">{campaign.description}</p>
      </header>

      {/* Step 1: Generate */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-violet font-mono text-xs">01</span>
          <h2 className="font-display text-sm font-semibold">AI Content Generation</h2>
        </div>
        <form onSubmit={handleGenerate} className="space-y-3">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:border-violet outline-none"
            placeholder="Describe what this communication should say…"
          />
          <div className="flex items-center gap-3">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-surface-alt border border-border rounded-lg px-3 py-2 text-xs focus:border-violet outline-none"
            >
              {TONES.map((t) => <option key={t} value={t}>{t} tone</option>)}
            </select>
            <button
              type="submit"
              disabled={generating || !brief}
              className="bg-violet text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate English content'}
            </button>
          </div>
        </form>

        {englishContent && (
          <div className="mt-4 bg-surface-alt border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-text-dim">Generated (English)</span>
              <span className={`text-[11px] ${englishContent.compliance_ok ? 'text-teal' : 'text-danger'}`}>
                {englishContent.compliance_ok ? '✓ Compliance passed' : `⚠ ${englishContent.compliance_notes}`}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{englishContent.content}</p>
          </div>
        )}
      </section>

      {/* Step 2: Translate */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-violet font-mono text-xs">02</span>
          <h2 className="font-display text-sm font-semibold">Multilingual Translation</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggle(targetLangs, setTargetLangs, lang)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                targetLangs.includes(lang)
                  ? 'bg-violet/15 border-violet text-violet'
                  : 'border-border text-text-dim hover:text-text'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
        <button
          onClick={handleTranslate}
          disabled={!englishContent || translating || targetLangs.length === 0}
          className="bg-violet text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
        >
          {translating ? 'Translating…' : `Translate into ${targetLangs.length} language(s)`}
        </button>

        {contents.filter((c) => c.language !== 'English').length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {contents.filter((c) => c.language !== 'English').map((c) => (
              <div key={c.id} className="bg-surface-alt border border-border rounded-lg p-3">
                <div className="text-[11px] text-teal mb-1.5">{c.language}</div>
                <p className="text-sm leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Step 3: Distribute */}
      <section className="bg-surface border border-border rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-violet font-mono text-xs">03</span>
          <h2 className="font-display text-sm font-semibold">Multi-Channel Distribution</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => toggle(selectedChannels, setSelectedChannels, ch)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition ${
                selectedChannels.includes(ch)
                  ? 'bg-signal/15 border-signal text-signal'
                  : 'border-border text-text-dim hover:text-text'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        <button
          onClick={handleSend}
          disabled={!englishContent || sending || selectedChannels.length === 0}
          className="bg-signal text-bg text-sm font-medium px-4 py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
        >
          {sending ? 'Dispatching…' : 'Dispatch campaign'}
        </button>

        {status && status.total > 0 && (
          <div className="mt-4 flex gap-4 flex-wrap">
            {Object.entries(status.by_status).map(([k, v]) => (
              <div key={k} className="text-xs">
                <span className="text-text-dim capitalize">{k}: </span>
                <span className="font-mono text-teal">{v}</span>
              </div>
            ))}
          </div>
        )}

        {sampleMessages.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] text-text-dim mb-2">
              Sample of actual personalized messages delivered (per recipient):
            </div>
            <div className="space-y-2">
              {sampleMessages.map((m) => (
                <div key={m.id} className="bg-surface-alt border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-[11px] text-text-dim mb-1">
                    <span className="text-signal">{recipientMap[m.recipient_id] || m.recipient_id}</span>
                    <span>·</span>
                    <span className="capitalize">{m.channel}</span>
                    <span>·</span>
                    <span>{m.language}</span>
                    <span>·</span>
                    <span className="capitalize text-teal">{m.status}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Step 4: Analytics */}
      {analytics && analytics.total_messages > 0 && (
        <section className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-violet font-mono text-xs">04</span>
            <h2 className="font-display text-sm font-semibold">Engagement Analytics</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-surface-alt border border-border rounded-lg p-3 text-center">
              <div className="font-mono text-lg text-teal">{analytics.sentiment_breakdown.positive}</div>
              <div className="text-[11px] text-text-dim">Positive feedback</div>
            </div>
            <div className="bg-surface-alt border border-border rounded-lg p-3 text-center">
              <div className="font-mono text-lg text-text-dim">{analytics.sentiment_breakdown.neutral}</div>
              <div className="text-[11px] text-text-dim">Neutral feedback</div>
            </div>
            <div className="bg-surface-alt border border-border rounded-lg p-3 text-center">
              <div className="font-mono text-lg text-danger">{analytics.sentiment_breakdown.negative}</div>
              <div className="text-[11px] text-text-dim">Negative feedback</div>
            </div>
          </div>
          {analytics.feedback_events.length > 0 && (
            <div className="space-y-2">
              {analytics.feedback_events.map((f, i) => (
                <div key={i} className="text-xs bg-surface-alt border border-border rounded-lg px-3 py-2 flex justify-between">
                  <span>{f.comment}</span>
                  <span className={`capitalize ${f.sentiment === 'positive' ? 'text-teal' : f.sentiment === 'negative' ? 'text-danger' : 'text-text-dim'}`}>
                    {f.sentiment}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
