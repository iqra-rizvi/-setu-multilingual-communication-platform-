import React from 'react'
import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'AI Content Generation', desc: 'Turn a one-line brief into polished campaign copy, tuned to the tone you need.', accent: 'violet' },
  { title: 'Multilingual Translation', desc: 'Reach citizens in Hindi, Tamil, Bengali, and every major Indian language.', accent: 'teal' },
  { title: 'Smart Personalization', desc: 'Every recipient gets a message shaped around their name, role, and language.', accent: 'signal' },
  { title: 'Multi-Channel Dispatch', desc: 'Email, SMS, WhatsApp, push, and web — one campaign, every channel.', accent: 'violet' },
  { title: 'Engagement Tracking', desc: 'See opens, clicks, and responses roll in as they happen.', accent: 'teal' },
  { title: 'Feedback Sentiment', desc: 'Understand how your audience actually feels about every announcement.', accent: 'signal' },
]

const ACCENT_CLASSES = {
  violet: 'text-violet border-violet/30 bg-violet/10',
  teal: 'text-teal border-teal/30 bg-teal/10',
  signal: 'text-signal border-signal/30 bg-signal/10',
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <span className="font-display font-semibold text-lg">Setu.Conn</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 max-w-4xl mx-auto text-center">
        <div className="inline-block text-[11px] tracking-wide uppercase text-violet border border-violet/30 bg-violet/10 rounded-full px-3 py-1 mb-6">
          AI-Based Multilingual Mass Communication Platform
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5">
          Reach every citizen,<br />in their own language.
        </h1>
        <p className="text-text-dim text-base md:text-lg max-w-xl mx-auto mb-9 leading-relaxed">
          Generate, translate, personalize, and dispatch public communication campaigns
          across every channel — powered by AI, built for government and civic organizations.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="bg-signal text-bg font-medium text-sm px-6 py-3 rounded-lg hover:brightness-110 transition"
          >
            Create an account
          </Link>
          <Link
            to="/login"
            className="border border-border text-sm px-6 py-3 rounded-lg hover:border-violet/40 transition"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-xl p-5">
              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border mb-3 ${ACCENT_CLASSES[f.accent]}`}>
                {f.title}
              </span>
              <p className="text-text-dim text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signal strip footer */}
      <footer className="border-t border-border px-8 py-6 text-center text-[11px] text-text-dim">
        Setu — Multilingual Mass Communication &amp; Public Awareness Management Platform
      </footer>
    </div>
  )
}
