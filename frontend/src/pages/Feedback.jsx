import React, { useEffect, useState } from 'react'
import api from '../api'
import StatCard from '../components/StatCard'

const SENTIMENT_STYLES = {
  positive: 'text-teal border-teal/30 bg-teal/10',
  neutral: 'text-text-dim border-border bg-surface-alt',
  negative: 'text-danger border-danger/30 bg-danger/10',
}

export default function Feedback() {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/analytics/feedback').then((res) => setData(res.data))
  }, [])

  if (!data) return <div className="text-text-dim text-sm">Loading feedback…</div>

  const filtered = filter === 'all' ? data.feedback : data.feedback.filter((f) => f.sentiment === filter)

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Feedback &amp; Sentiment</h1>
        <p className="text-text-dim text-sm mt-1">
          Every recipient response, analyzed for sentiment, across all campaigns.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Feedback" value={data.total} accent="text" />
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
        {filtered.map((f) => (
          <div key={f.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[11px] text-text-dim">
                <span className="text-signal">{f.recipient_name}</span>
                <span>·</span>
                <span>{f.campaign_name}</span>
                <span>·</span>
                <span>{f.language}</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${SENTIMENT_STYLES[f.sentiment] || SENTIMENT_STYLES.neutral}`}>
                {f.sentiment || 'unrated'}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{f.comment}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-text-dim text-sm py-12 border border-dashed border-border rounded-xl">
            No feedback in this category yet.
          </div>
        )}
      </div>
    </div>
  )
}
