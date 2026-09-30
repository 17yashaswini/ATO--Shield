import { useState } from 'react'
import RiskBadge from '../components/RiskBadge'
import { runSimulation } from '../services/adminService'

const SCENARIOS = [
  { key: 'normal_login', label: 'Normal Login', desc: 'Trusted device, familiar location, no failed attempts.' },
  { key: 'new_device', label: 'New Device', desc: 'Login from a device never seen before.' },
  { key: 'unusual_time', label: 'Unusual Login Time', desc: 'A login that lands outside typical active hours.' },
  { key: 'multiple_failed_attempts', label: 'Multiple Failed Attempts', desc: 'Several failed attempts before the login.' },
  { key: 'new_location', label: 'New Location', desc: 'Login from a location outside recent activity.' },
  { key: 'combined_ato_attempt', label: 'Combined Account Takeover Attempt', desc: 'New device + new location + odd hour + failed attempts.' },
]

export default function AttackSimulator() {
  const [running, setRunning] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const run = async (scenarioKey) => {
    setRunning(scenarioKey)
    setError('')
    setResult(null)
    try {
      const res = await runSimulation(scenarioKey)
      setResult(res)
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation failed')
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold">Attack Simulator</h1>
        <p className="text-sm text-slate-500 mt-1">
          Safe, controlled demonstration of the risk engine. No real credential attacks are performed.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {SCENARIOS.map((s) => (
          <div key={s.key} className="card p-4 flex flex-col justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
            </div>
            <button className="btn-primary text-xs px-3 py-1.5 self-start" disabled={running} onClick={() => run(s.key)}>
              {running === s.key ? 'Running...' : 'Run simulation'}
            </button>
          </div>
        ))}
      </div>

      {error && <div className="text-sm text-risk-high bg-risk-high/10 rounded-lg px-3 py-2">{error}</div>}

      {result && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-400">
              Result: {SCENARIOS.find((s) => s.key === result.scenario)?.label}
            </h2>
            <RiskBadge level={result.risk_level} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Input Features</p>
              <ul className="text-sm space-y-1 text-slate-300 font-mono">
                <li>device: {result.input_features.device_name}</li>
                <li>location: {result.input_features.location}</li>
                <li>failed_attempts: {result.input_features.failed_attempts}</li>
                <li>login_hour: {result.input_features.login_hour}</li>
              </ul>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">ML / Risk Output</p>
              <ul className="text-sm space-y-1 text-slate-300 font-mono">
                <li>anomaly_score: {result.anomaly_score.toFixed(4)}</li>
                <li>risk_score: {result.risk_score}/100</li>
                <li>action: {result.action}</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Human-readable reasons</p>
          <ul className="space-y-1">
            {result.reasons.map((r, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-accent-500">•</span>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
