import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const items = [
  { to: '/', label: 'Dashboard', glyph: '◆' },
  { to: '/audience', label: 'Audience', glyph: '◈' },
  { to: '/campaigns', label: 'Campaigns', glyph: '▲' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <span className="font-display font-semibold text-lg tracking-tight">Setu</span>
        </div>
        <p className="text-[11px] text-text-dim mt-1 leading-snug">
          Multilingual Mass Communication &amp; Public Awareness Platform
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-alt text-text border border-border'
                  : 'text-text-dim hover:text-text hover:bg-surface-alt/60'
              }`
            }
          >
            <span className="text-violet text-xs w-3">{item.glyph}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="text-xs text-text-dim mb-1">Signed in as</div>
        <div className="text-sm font-medium truncate">{user?.username}</div>
        <div className="text-[11px] text-violet mb-3 capitalize">{user?.role?.replace('_', ' ')}</div>
        <button
          onClick={logout}
          className="w-full text-xs px-3 py-2 rounded-md border border-border text-text-dim hover:text-text hover:border-danger/50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
