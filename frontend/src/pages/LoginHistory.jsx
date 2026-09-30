import { useEffect, useState } from 'react'
import LoadingState from '../components/LoadingState'
import RiskBadge from '../components/RiskBadge'
import { getLoginHistory } from '../services/securityService'

export default function LoginHistory() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getLoginHistory(100).then(setEvents).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? events : events.filter((e) => e.risk_level === filter)

  if (loading) return <LoadingState label="Loading login history..." />

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Login History</h1>
          <p className="text-sm text-slate-500 mt-1">Every login attempt on your account</p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                filter === f ? 'bg-accent-500/15 border-accent-500/40 text-accent-400' : 'border-white/10 text-slate-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer"
                  onClick={() => setSelected(e)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-xs">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{e.device_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">{e.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {e.login_success ? <span className="text-risk-low text-xs">Success</span> : <span className="text-risk-high text-xs">Failed</span>}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={e.risk_level} size="sm" /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">{e.action}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No login events match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Event Details</h3>
              <RiskBadge level={selected.risk_level} />
            </div>
            <p className="text-sm text-slate-400 mb-1">Score: <span className="text-slate-200">{selected.risk_score}/100</span></p>
            <p className="text-sm text-slate-400 mb-3">{selected.device_name} · {selected.location}</p>
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Why it was flagged</p>
            <ul className="space-y-1 mb-4">
              {(selected.reasons || []).map((r, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-accent-500">•</span>{r}</li>
              ))}
            </ul>
            <button className="btn-secondary w-full" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
