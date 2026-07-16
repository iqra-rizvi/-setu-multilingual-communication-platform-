import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api'
import StatCard from '../components/StatCard'

const CHANNEL_COLORS = { email: '#9B8CFF', sms: '#FFA94D', whatsapp: '#2DD4BF', push: '#60A5FA', web: '#F472B6' }

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/analytics/overview').then((res) => setData(res.data))
  }, [])

  if (!data) {
    return <div className="text-text-dim text-sm">Loading dashboard…</div>
  }

  const maxLangCount = Math.max(1, ...data.language_breakdown.map((l) => l.count))

  return (
    <div>
      <header className="mb-7">
        <h1 className="font-display text-2xl font-semibold">Broadcast Overview</h1>
        <p className="text-text-dim text-sm mt-1">
          Live reach and engagement across every active campaign and channel.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Campaigns" value={data.total_campaigns} accent="text" />
        <StatCard label="Audience Reached" value={data.total_recipients} accent="violet" />
        <StatCard label="Delivery Rate" value={data.delivery_rate} suffix="%" accent="teal" />
        <StatCard label="Failure Rate" value={data.failure_rate} suffix="%" accent="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Signature element: language broadcast pulse */}
        <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-sm font-semibold">Language Broadcast Pulse</h2>
            <span className="text-[11px] text-text-dim">messages sent, by recipient language</span>
          </div>
          <div className="flex items-end gap-3 h-40 px-1">
            {data.language_breakdown.map((l, i) => {
              const heightPct = Math.max(8, (l.count / maxLangCount) * 100)
              return (
                <div key={l.language} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-[10px] font-mono text-text-dim">{l.count}</div>
                  <div
                    className="signal-bar w-full rounded-t-sm"
                    style={{
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, #FFA94D, #9B8CFF)`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                  <div className="text-[10px] text-text-dim rotate-0 text-center leading-tight">
                    {l.language}
                  </div>
                </div>
              )
            })}
            {data.language_breakdown.length === 0 && (
              <div className="text-text-dim text-sm w-full text-center pb-6">
                No campaigns sent yet — send one to see language reach here.
              </div>
            )}
          </div>
        </div>

        {/* Channel mix */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold mb-4">Channel Mix</h2>
          {data.channel_breakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={160}>
                <PieChart>
                  <Pie
                    data={data.channel_breakdown}
                    dataKey="count"
                    nameKey="channel"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {data.channel_breakdown.map((c, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[c.channel] || '#8D96AC'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1A2540', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {data.channel_breakdown.map((c) => (
                  <div key={c.channel} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: CHANNEL_COLORS[c.channel] || '#8D96AC' }}
                    />
                    <span className="capitalize text-text-dim">{c.channel}</span>
                    <span className="font-mono ml-auto">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-text-dim text-sm py-10 text-center">No channel data yet.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-5">
        <StatCard label="Open Rate" value={data.open_rate} suffix="%" accent="signal" />
        <StatCard label="Click Rate" value={data.click_rate} suffix="%" accent="violet" />
        <StatCard label="Messages Sent" value={data.total_messages} accent="teal" />
      </div>
    </div>
  )
}
