import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 bg-base-900/90 backdrop-blur border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between">
      <button className="md:hidden btn-ghost px-2 py-2" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>
      <div className="hidden md:block text-sm text-slate-500">
        Signed in as <span className="text-slate-300">{user?.email}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-sm font-semibold">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <button onClick={handleLogout} className="btn-ghost text-xs px-3 py-1.5">Log out</button>
      </div>
    </header>
  )
}
