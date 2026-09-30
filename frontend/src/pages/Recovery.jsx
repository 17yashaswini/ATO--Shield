import { useEffect, useState } from 'react'
import LoadingState from '../components/LoadingState'
import { startRecovery, recoveryAction } from '../services/securityService'

const STEP_META = [
  { key: 'revoke_suspicious_session', title: 'Revoke suspicious session', desc: 'Immediately cut off access from the suspicious device.' },
  { key: 'sign_out_other_sessions', title: 'Sign out other sessions', desc: 'End all sessions except the one you are using right now.' },
  { key: 'change_password', title: 'Change your password', desc: 'Set a new password the attacker will not know.' },
  { key: 'review_activity', title: 'Review recent activity', desc: 'Check your login history for anything else unusual.' },
  { key: 'enable_stronger_auth', title: 'Enable stronger authentication', desc: 'Turn on additional authentication for extra protection.' },
]

export default function Recovery() {
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(null)
  const [busyStep, setBusyStep] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)

  useEffect(() => {
    startRecovery().then(setRecovery).finally(() => setLoading(false))
  }, [])

  const completeStep = async (key, extra = {}) => {
    setBusyStep(key)
    try {
      const updated = await recoveryAction(key, extra)
      setRecovery(updated)
      setShowPasswordField(false)
    } finally {
      setBusyStep(null)
    }
  }

  if (loading) return <LoadingState label="Preparing your recovery plan..." />

  const steps = recovery.steps
  const completedCount = Object.values(steps).filter(Boolean).length
  const progress = Math.round((completedCount / Object.keys(steps).length) * 100)

  return (
    <div className="space-y-6 pb-10 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">Account Recovery</h1>
        <p className="text-sm text-slate-500 mt-1">Follow these steps to secure your account</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Security recovery</span>
          <span className="text-sm text-accent-400 font-semibold">{progress}% complete</span>
        </div>
        <div className="w-full h-2 bg-base-700 rounded-full overflow-hidden">
          <div className="h-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {STEP_META.map((s, i) => {
          const done = steps[s.key]
          return (
            <div key={s.key} className={`card p-4 flex items-start gap-4 ${done ? 'opacity-70' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${done ? 'bg-risk-low/20 text-risk-low' : 'bg-base-700 text-slate-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>

                {s.key === 'change_password' && !done && showPasswordField && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password" className="input" placeholder="New password (min 8 chars)"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      className="btn-primary shrink-0"
                      disabled={newPassword.length < 8 || busyStep === s.key}
                      onClick={() => completeStep(s.key, { new_password: newPassword })}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              {!done && s.key !== 'change_password' && (
                <button className="btn-secondary text-xs px-3 py-1.5 shrink-0" disabled={busyStep === s.key} onClick={() => completeStep(s.key)}>
                  {busyStep === s.key ? 'Working...' : 'Do it'}
                </button>
              )}
              {!done && s.key === 'change_password' && !showPasswordField && (
                <button className="btn-secondary text-xs px-3 py-1.5 shrink-0" onClick={() => setShowPasswordField(true)}>
                  Do it
                </button>
              )}
            </div>
          )
        })}
      </div>

      {progress === 100 && (
        <div className="text-sm text-risk-low bg-risk-low/10 rounded-lg px-4 py-3">
          Your account has been fully secured. Great work.
        </div>
      )}
    </div>
  )
}
