import { useEffect, useState } from 'react'
import LoadingState from '../components/LoadingState'
import RiskBadge from '../components/RiskBadge'
import { getAdminEvents } from '../services/adminService'

export default function AdminEvents() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])

  useEffect(() => { getAdminEvents().then(setEvents).finally(() => setLoading(false)) }, [])

  if (loading) return <LoadingState label="Loading security events..." />

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-semibold">Security Events</h1>
        <p className="text-sm text-slate-500 mt-1">Investigate flagged activity across all accounts</p>
      </div>

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="card p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="font-medium text-sm">{e.event_type?.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>
              <p className="text-[11px] text-slate-600 mt-1">{new Date(e.timestamp).toLocaleString()} · user {e.user_id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RiskBadge level={e.severity} size="sm" />
              <span className={`text-[11px] ${e.resolved ? 'text-risk-low' : 'text-risk-medium'}`}>
                {e.resolved ? 'Resolved' : 'Unresolved'}
              </span>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-slate-500">No security events yet.</p>}
      </div>
    </div>
  )
}
