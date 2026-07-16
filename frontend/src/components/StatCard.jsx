import React from 'react'

export default function StatCard({ label, value, suffix = '', accent = 'text' }) {
  const accentClass = {
    text: 'text-text',
    signal: 'text-signal',
    teal: 'text-teal',
    violet: 'text-violet',
    danger: 'text-danger',
  }[accent]

  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-wide text-text-dim mb-2">{label}</div>
      <div className={`font-mono text-2xl font-medium ${accentClass}`}>
        {value}
        <span className="text-sm text-text-dim ml-0.5">{suffix}</span>
      </div>
    </div>
  )
}
