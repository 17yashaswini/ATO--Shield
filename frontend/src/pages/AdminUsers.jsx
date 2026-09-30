import { useEffect, useState } from 'react'
import LoadingState from '../components/LoadingState'
import { getAdminUsers } from '../services/adminService'

export default function AdminUsers() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])

  useEffect(() => { getAdminUsers().then(setUsers).finally(() => setLoading(false)) }, [])

  if (loading) return <LoadingState label="Loading users..." />

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-slate-500 mt-1">All registered accounts</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Security Score</th>
                <th className="px-5 py-3 font-medium">MFA</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 whitespace-nowrap">{u.name}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-400">{u.email}</td>
                  <td className="px-5 py-3 capitalize">{u.role}</td>
                  <td className="px-5 py-3">{u.security_score}</td>
                  <td className="px-5 py-3">{u.mfa_enabled ? 'On' : 'Off'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
