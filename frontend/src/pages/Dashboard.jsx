import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SecurityScore from '../components/SecurityScore'
import { RiskCard } from '../components/RiskCard'
import SecurityTimeline from '../components/SecurityTimeline'
import LoadingState from '../components/LoadingState'
import { RecommendationCard } from '../components/RiskCard'
import { SecurityEventCard } from '../components/RiskCard'
import { SessionCard } from '../components/RiskCard'
import {
  getSecurityScore, getSecurityEvents, getRecommendations,
  getTimeline, getSessions,
} from '../services/securityService'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scoreData, setScoreData] = useState(null)
  const [events, setEvents] = useState([])
  const [recs, setRecs] = useState([])
  const [timeline, setTimeline] = useState([])
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    Promise.all([getSecurityScore(), getSecurityEvents(), getRecommendations(), getTimeline(), getSessions()])
      .then(([score, ev, rec, tl, sess]) => {
        setScoreData(score)
        setEvents(ev)
        setRecs(rec)
        setTimeline(tl)
        setSessions(sess)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Loading your security overview..." />

  const latestUnresolved = events.find((e) => !e.resolved)
  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE')

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold">Security Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Am I safe? What happened? Why? What should I do?</p>
      </div>

      {latestUnresolved && (
        <div className="card p-5 border-l-4 border-l-risk-high bg-risk-high/5">
          <p className="text-sm font-semibold text-risk-high mb-1">⚠ Your account needs attention</p>
          <p className="text-sm text-slate-300 mb-3">{latestUnresolved.description}</p>
          <button className="btn-primary text-xs px-3 py-1.5" onClick={() => navigate('/security-events')}>
            Review this event
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <SecurityScore score={scoreData.security_score} label={scoreData.label} issues={scoreData.issues} />
        <RiskCard
          riskLevel={events[0]?.severity || 'LOW'}
          riskScore={scoreData.security_score}
          reasons={scoreData.issues.length ? scoreData.issues : ['No unusual activity detected recently']}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Recent Suspicious Activity</h2>
          <div className="space-y-2">
            {events.length === 0 && <p className="text-sm text-slate-500">No suspicious activity recorded.</p>}
            {events.slice(0, 3).map((e) => (
              <SecurityEventCard key={e.id} event={e} onClick={() => navigate('/security-events')} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Recommended Actions</h2>
          <div className="space-y-2">
            {recs.length === 0 && <p className="text-sm text-slate-500">You're all caught up. No actions needed.</p>}
            {recs.slice(0, 3).map((r) => <RecommendationCard key={r.id} rec={r} />)}
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Active Sessions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {activeSessions.slice(0, 4).map((s) => <SessionCard key={s.id} session={s} onRevoke={() => navigate('/sessions')} />)}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-medium text-slate-400 mb-4">Security Timeline</h2>
        <SecurityTimeline items={timeline.slice(0, 8)} />
      </section>
    </div>
  )
}
