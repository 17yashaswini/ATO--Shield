import RiskBadge from './RiskBadge'

const DOT_COLOR = {
  HIGH: 'bg-risk-high',
  MEDIUM: 'bg-risk-medium',
  LOW: 'bg-risk-low',
}

export default function SecurityTimeline({ items = [] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No activity recorded yet.</p>
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/10" />
      <ul className="space-y-5">
        {items.map((item, i) => {
          const date = new Date(item.timestamp)
          return (
            <li key={i} className="relative">
              <span
                className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-base-850 ${
                  DOT_COLOR[item.risk_level] || 'bg-slate-500'
                }`}
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-medium">{item.label}</p>
                {item.risk_level && <RiskBadge level={item.risk_level} size="sm" />}
              </div>
              {item.detail && <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>}
              <p className="text-[11px] text-slate-600 mt-1 font-mono">
                {date.toLocaleDateString()} · {date.toLocaleTimeString()}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
