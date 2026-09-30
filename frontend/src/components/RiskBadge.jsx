const STYLES = {
  LOW: 'bg-risk-low/15 text-risk-low',
  MEDIUM: 'bg-risk-medium/15 text-risk-medium',
  HIGH: 'bg-risk-high/15 text-risk-high',
}

export default function RiskBadge({ level, size = 'md' }) {
  if (!level) return null
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'badge'
  return (
    <span className={`${STYLES[level] || 'bg-slate-600/20 text-slate-300'} ${sizeClass} font-semibold uppercase tracking-wide rounded-full inline-flex items-center`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${level === 'LOW' ? 'bg-risk-low' : level === 'MEDIUM' ? 'bg-risk-medium' : 'bg-risk-high'}`} />
      {level}
    </span>
  )
}
