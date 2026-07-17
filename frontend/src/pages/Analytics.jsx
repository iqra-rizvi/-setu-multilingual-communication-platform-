import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const TYPE_COLORS = {
  awareness: 'text-teal border-teal/30 bg-teal/10',
  emergency: 'text-danger border-danger/30 bg-danger/10',
  education: 'text-violet border-violet/30 bg-violet/10',
  announcement: 'text-signal border-signal/30 bg-signal/10',
}

export default function Analytics() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    api.get('/analytics/campaigns-summary').then((res) => setRows(res.data))
  }, [])

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Campaign Analytics</h1>
        <p className="text-text-dim text-sm mt-1">
          Delivery, open, and click performance for every campaign, side by side.
        </p>
      </header>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-text-dim border-b border-border">
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Messages</th>
              <th className="px-4 py-3 font-medium">Delivery</th>
              <th className="px-4 py-3 font-medium">Open</th>
              <th className="px-4 py-3 font-medium">Click</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-alt/50">
                <td className="px-4 py-3">
                  <Link to={`/campaigns/${r.id}`} className="font-medium hover:text-violet transition">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${TYPE_COLORS[r.type]}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-dim capitalize">{r.status}</td>
                <td className="px-4 py-3 font-mono">{r.total_messages}</td>
                <td className="px-4 py-3 font-mono text-teal">{r.delivery_rate}%</td>
                <td className="px-4 py-3 font-mono text-signal">{r.open_rate}%</td>
                <td className="px-4 py-3 font-mono text-violet">{r.click_rate}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-dim text-sm">
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
