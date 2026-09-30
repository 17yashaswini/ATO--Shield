import RiskBadge from './RiskBadge'

export function RiskCard({ riskLevel, riskScore, reasons = [] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400">Current Risk Status</h3>
        <RiskBadge level={riskLevel} />
      </div>
      <p className="text-2xl font-bold mb-3">{riskScore}<span className="text-slate-500 text-base font-normal"> / 100</span></p>
      {reasons.length > 0 && (
        <ul className="space-y-1.5 mt-2">
          {reasons.map((r, i) => (
            <li key={i} className="text-sm text-slate-400 flex gap-2">
              <span className="text-accent-500">•</span>{r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LoginEventCard({ event, onClick }) {
  const date = new Date(event.timestamp)
  return (
    <button onClick={onClick} className="w-full text-left card p-4 hover:border-accent-500/40 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{event.device_name || 'Unknown device'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{event.location} • {date.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RiskBadge level={event.risk_level} size="sm" />
        </div>
      </div>
    </button>
  )
}

export function SecurityEventCard({ event, onClick }) {
  const date = new Date(event.timestamp)
  return (
    <button onClick={onClick} className="w-full text-left card p-4 hover:border-accent-500/40 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{event.event_type?.replaceAll('_', ' ')}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{event.description}</p>
          <p className="text-[11px] text-slate-600 mt-1">{date.toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <RiskBadge level={event.severity} size="sm" />
          {!event.resolved && <span className="text-[10px] text-accent-400">Needs review</span>}
        </div>
      </div>
    </button>
  )
}

export function SessionCard({ session, onRevoke, revoking }) {
  const isActive = session.status === 'ACTIVE'
  return (
    <div className={`card p-4 flex items-center justify-between gap-3 ${session.is_suspicious && isActive ? 'border-risk-high/40' : ''}`}>
      <div className="min-w-0">
        <p className="font-medium text-sm flex items-center gap-2 truncate">
          {session.device_name}
          {session.is_suspicious && isActive && (
            <span className="text-[10px] text-risk-high font-semibold">⚠ SUSPICIOUS</span>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{session.location}</p>
        <p className="text-[11px] text-slate-600 mt-1">
          {isActive ? 'Active now' : session.status === 'REVOKED' ? 'Revoked' : 'Expired'}
        </p>
      </div>
      {isActive && (
        <button className="btn-secondary text-xs px-3 py-1.5 shrink-0" onClick={onRevoke} disabled={revoking}>
          {revoking ? 'Revoking...' : 'Revoke'}
        </button>
      )}
    </div>
  )
}

const PRIORITY_STYLE = {
  HIGH: 'border-l-risk-high',
  MEDIUM: 'border-l-risk-medium',
  LOW: 'border-l-risk-low',
}

export function RecommendationCard({ rec }) {
  return (
    <div className={`card p-4 border-l-4 ${PRIORITY_STYLE[rec.priority] || 'border-l-slate-600'}`}>
      <p className="font-medium text-sm">{rec.title}</p>
      <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
    </div>
  )
}
