export default function SecurityScore({ score, label, issues = [] }) {
  const color = score >= 80 ? 'text-risk-low' : score >= 50 ? 'text-risk-medium' : 'text-risk-high'
  const ring = score >= 80 ? '#3fd0c9' : score >= 50 ? '#e8a13d' : '#e5484d'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Your Security Score</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#242c3a" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke={ring} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${color}`}>{score}</span>
            <span className="text-[11px] text-slate-500">/ 100</span>
          </div>
        </div>
        <div className="flex-1">
          <p className={`text-lg font-semibold ${color}`}>{label}</p>
          {issues.length > 0 ? (
            <p className="text-sm text-slate-400 mt-1">
              {issues.length} issue{issues.length > 1 ? 's' : ''} need{issues.length === 1 ? 's' : ''} your attention
            </p>
          ) : (
            <p className="text-sm text-slate-400 mt-1">No issues detected right now</p>
          )}
        </div>
      </div>
    </div>
  )
}
