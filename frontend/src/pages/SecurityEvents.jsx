import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingState from '../components/LoadingState'
import RiskBadge from '../components/RiskBadge'
import { getSecurityEvents, getSecurityEventDetail, confirmEvent, reportEvent } from '../services/securityService'

export default function SecurityEvents() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const load = () => getSecurityEvents().then(setEvents).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openDetail = async (event) => {
    setDetailLoading(true)
    try {
      const d = await getSecurityEventDetail(event.id)
      setDetail(d)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleConfirm = async () => {
    setActing(true)
    try {
      await confirmEvent(detail.id)
      setDetail(null)
      await load()
    } finally {
      setActing(false)
    }
  }

  const handleReport = async () => {
    setActing(true)
    try {
      await reportEvent(detail.id)
      setDetail(null)
      navigate('/recovery')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <LoadingState label="Loading security events..." />

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-semibold">Security Events</h1>
        <p className="text-sm text-slate-500 mt-1">Suspicious activity detected on your account</p>
      </div>

      <div className="space-y-2">
        {events.length === 0 && <p className="text-sm text-slate-500">No security events recorded.</p>}
        {events.map((e) => (
          <button key={e.id} onClick={() => openDetail(e)} className="w-full text-left card p-4 hover:border-accent-500/40 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{e.event_type?.replaceAll('_', ' ')}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{e.description}</p>
                <p className="text-[11px] text-slate-600 mt-1">{new Date(e.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <RiskBadge level={e.severity} size="sm" />
                {!e.resolved && <span className="text-[10px] text-accent-400">Needs review</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !acting && setDetail(null)}>
          <div className="card max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading && <LoadingState label="Loading event..." />}
            {detail && !detailLoading && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">Was this you?</h3>
                  <RiskBadge level={detail.severity} />
                </div>
                <p className="text-sm text-slate-400 mb-4">{detail.what_happened}</p>

                {detail.why_flagged?.length > 0 && (
                  <>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Why we flagged it</p>
                    <ul className="space-y-1 mb-4">
                      {detail.why_flagged.map((r, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-accent-500">•</span>{r}</li>
                      ))}
                    </ul>
                  </>
                )}

                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">What ATO Shield did</p>
                <p className="text-sm text-slate-300 mb-5">{detail.what_we_did}</p>

                {!detail.resolved ? (
                  <div className="flex gap-3">
                    <button className="btn-secondary flex-1" disabled={acting} onClick={handleConfirm}>
                      Yes, it was me
                    </button>
                    <button className="btn-danger flex-1" disabled={acting} onClick={handleReport}>
                      No, secure my account
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-risk-low bg-risk-low/10 rounded-lg px-3 py-2">This event has already been reviewed.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
