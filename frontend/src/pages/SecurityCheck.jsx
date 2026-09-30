import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingState from '../components/LoadingState'
import { getSecurityScore, getRecommendations } from '../services/securityService'

export default function SecurityCheck() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(null)
  const [recs, setRecs] = useState([])

  useEffect(() => {
    Promise.all([getSecurityScore(), getRecommendations()])
      .then(([s, r]) => { setScore(s); setRecs(r) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Checking your account health..." />

  const checks = [
    { ok: !score.issues.includes('Suspicious active session(s) detected'), label: 'No suspicious active sessions' },
    { ok: true, label: 'Password protection active' },
    { ok: !score.issues.some((i) => i.includes('high-risk')), label: 'No unresolved high-risk events' },
    { ok: !score.issues.includes('Additional authentication (MFA) not enabled'), label: 'Additional authentication enabled' },
  ]

  return (
    <div className="space-y-6 pb-10 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Security Health</h1>
        <p className="text-sm text-slate-500 mt-1">A quick check of your account's current state</p>
      </div>

      <div className="card p-5 space-y-3">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={c.ok ? 'text-risk-low' : 'text-risk-medium'}>{c.ok ? '✓' : '⚠'}</span>
            <span className="text-sm">{c.label}</span>
          </div>
        ))}
      </div>

      {recs.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-medium text-slate-400 mb-3">Recommended actions</h2>
          <div className="space-y-3">
            {recs.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </div>
                <button
                  className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                  onClick={() => navigate(r.action === 'REVOKE_SESSION' || r.action === 'REVIEW_SESSIONS' ? '/sessions' : '/recovery')}
                >
                  Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
