import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import LoadingState from '../components/LoadingState'
import RiskBadge from '../components/RiskBadge'
import { getAdminDashboard } from '../services/adminService'

const RISK_COLORS = { LOW: '#3fd0c9', MEDIUM: '#e8a13d', HIGH: '#e5484d' }
const ACTION_COLORS = { ALLOW: '#3fd0c9', FLAG: '#e8a13d', BLOCK: '#e5484d' }

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => { getAdminDashboard().then(setData).finally(() => setLoading(false)) }, [])

  if (loading) return <LoadingState label="Loading admin metrics..." />

  const riskData = Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
  const actionData = Object.entries(data.action_distribution).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Security monitoring across all users</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Users" value={data.totals.total_users} />
        <StatCard label="Login Attempts" value={data.totals.total_logins} />
        <StatCard label="Suspicious Attempts" value={data.totals.suspicious_attempts} />
        <StatCard label="Blocked Attempts" value={data.totals.blocked_attempts} />
        <StatCard label="High-Risk Events" value={data.totals.high_risk_events} />
        <StatCard label="Active Sessions" value={data.totals.active_sessions} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-medium text-slate-400 mb-3">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {riskData.map((d) => <Cell key={d.name} fill={RISK_COLORS[d.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#141a24', border: '1px solid #242c3a', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium text-slate-400 mb-3">Blocked vs Allowed vs Flagged</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={actionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242c3a" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#141a24', border: '1px solid #242c3a', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {actionData.map((d) => <Cell key={d.name} fill={ACTION_COLORS[d.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="text-sm font-medium text-slate-400 px-5 pt-5 pb-3">Recent Logins (all users)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                <th className="px-5 py-2 font-medium">Time</th>
                <th className="px-5 py-2 font-medium">Device</th>
                <th className="px-5 py-2 font-medium">Location</th>
                <th className="px-5 py-2 font-medium">Risk</th>
                <th className="px-5 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_logins.map((l) => (
                <tr key={l.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-2.5 whitespace-nowrap">{l.device_name}</td>
                  <td className="px-5 py-2.5 text-slate-400 whitespace-nowrap">{l.location}</td>
                  <td className="px-5 py-2.5"><RiskBadge level={l.risk_level} size="sm" /></td>
                  <td className="px-5 py-2.5 text-xs text-slate-400">{l.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
