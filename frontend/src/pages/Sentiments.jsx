import React, { useEffect, useState } from 'react'
import api from '../services/api'
import StatCard from '../components/StatCard'

const SENTIMENT_STYLES = {
  positive: 'text-teal border-teal/30 bg-teal/10',
  neutral: 'text-text-dim border-border bg-surface-alt',
  negative: 'text-danger border-danger/30 bg-danger/10',
}

const TYPE_COLORS = {
  awareness: 'text-teal border-teal/30 bg-teal/10',
  emergency: 'text-danger border-danger/30 bg-danger/10',
  education: 'text-violet border-violet/30 bg-violet/10',
  announcement: 'text-signal border-signal/30 bg-signal/10',
}

export default function Sentiments() {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/analytics/sentiments').then((res) => setData(res.data))
  }, [])

  if (!data) return <div className="text-text-dim text-sm">Loading sentiment analysis…</div>

  const filtered = filter === 'all' ? data.messages : data.messages.filter((m) => m.sentiment_label === filter)

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Message Sentiment</h1>
        <p className="text-text-dim text-sm mt-1">
          AI sentiment analysis of every campaign message — is the content itself
          positive, neutral, or negative in tone, before it ever reaches a recipient.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Messages Analyzed" value={data.total} accent="text" />
        <StatCard label="Positive" value={data.sentiment_totals.positive} accent="teal" />
        <StatCard label="Neutral" value={data.sentiment_totals.neutral} accent="text" />
        <StatCard label="Negative" value={data.sentiment_totals.negative} accent="danger" />
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'positive', 'neutral', 'negative'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize transition ${
              filter === s ? 'bg-violet/15 border-violet text-violet' : 'border-border text-text-dim hover:text-text'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[11px] text-text-dim">
                <span className="text-signal">{m.campaign_name}</span>
                {m.campaign_type && (
                  <span className={`px-2 py-0.5 rounded-full border capitalize ${TYPE_COLORS[m.campaign_type] || ''}`}>
                    {m.campaign_type}
                  </span>
                )}
                <span>·</span>
                <span>{m.language}</span>
                <span>·</span>
                <span className="capitalize">{m.tone}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.sentiment_score !== null && (
                  <span className="font-mono text-[11px] text-text-dim">{m.sentiment_score}</span>
                )}
                <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${SENTIMENT_STYLES[m.sentiment_label] || SENTIMENT_STYLES.neutral}`}>
                  {m.sentiment_label}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{m.content}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-text-dim text-sm py-12 border border-dashed border-border rounded-xl">
            No messages in this category yet.
          </div>
        )}
      </div>
    </div>
  )
}
