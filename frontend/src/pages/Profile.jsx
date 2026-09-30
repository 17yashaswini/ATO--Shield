import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 pb-10 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your account details</p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <p className="text-xs text-slate-500">Name</p>
          <p className="text-sm">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p className="text-sm">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Role</p>
          <p className="text-sm capitalize">{user?.role}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Additional authentication</p>
          <p className="text-sm">{user?.mfa_enabled ? 'Enabled' : 'Not enabled'}</p>
        </div>
      </div>
    </div>
  )
}
