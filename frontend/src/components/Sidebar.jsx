import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '◆' },
  { to: '/login-history', label: 'Login History', icon: '⏱' },
  { to: '/sessions', label: 'Sessions', icon: '💻' },
  { to: '/security-events', label: 'Security Events', icon: '⚠' },
  { to: '/security-check', label: 'Security Health', icon: '✓' },
  { to: '/profile', label: 'Profile', icon: '⚙' },
]

const adminLinks = [
  { to: '/admin', label: 'Admin Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/events', label: 'Events', icon: '🔔' },
  { to: '/admin/simulator', label: 'Attack Simulator', icon: '🧪' },
]

function LinkItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-accent-500/10 text-accent-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`
      }
    >
      <span className="text-base">{icon}</span>
      {label}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-base-900 border-r border-white/5 flex flex-col transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
          <span className="text-accent-400 text-xl">🛡</span>
          <span className="font-semibold tracking-tight">ATO Shield</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {userLinks.map((l) => <LinkItem key={l.to} {...l} />)}
          {isAdmin && (
            <>
              <p className="px-3.5 pt-5 pb-2 text-[11px] uppercase tracking-wider text-slate-600">Admin</p>
              {adminLinks.map((l) => <LinkItem key={l.to} {...l} />)}
            </>
          )}
        </nav>
      </aside>
    </>
  )
}
