import { useEffect, useState } from 'react'
import LoadingState from '../components/LoadingState'
import { SessionCard } from '../components/RiskCard'
import { getSessions, revokeSession, revokeOtherSessions } from '../services/securityService'

export default function Sessions() {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [revokingId, setRevokingId] = useState(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const load = () => getSessions().then(setSessions).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleRevoke = async (id) => {
    setRevokingId(id)
    try {
      await revokeSession(id)
      await load()
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAll = async () => {
    setRevokingAll(true)
    try {
      await revokeOtherSessions()
      await load()
    } finally {
      setRevokingAll(false)
    }
  }

  if (loading) return <LoadingState label="Loading sessions..." />

  const active = sessions.filter((s) => s.status === 'ACTIVE')
  const inactive = sessions.filter((s) => s.status !== 'ACTIVE')

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Active Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">Devices currently signed in to your account</p>
        </div>
        {active.length > 1 && (
          <button className="btn-danger text-xs px-3 py-1.5" onClick={handleRevokeAll} disabled={revokingAll}>
            {revokingAll ? 'Signing out...' : 'Sign out other sessions'}
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {active.map((s) => (
          <SessionCard key={s.id} session={s} revoking={revokingId === s.id} onRevoke={() => handleRevoke(s.id)} />
        ))}
        {active.length === 0 && <p className="text-sm text-slate-500">No active sessions.</p>}
      </div>

      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-3 mt-6">Past Sessions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {inactive.slice(0, 8).map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}
    </div>
  )
}
