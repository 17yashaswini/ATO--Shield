import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', location: 'Bengaluru, IN' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🛡</div>
          <h1 className="text-xl font-semibold">Sign in to ATO Shield</h1>
          <p className="text-sm text-slate-500 mt-1">Protect and understand your account activity</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && <div className="text-sm text-risk-high bg-risk-high/10 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
            <input
              type="email" required className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Password</label>
            <input
              type="password" required className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer text-slate-400">Simulate login location (demo)</summary>
            <input
              type="text" className="input mt-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Lagos, NG"
            />
          </details>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account? <Link to="/register" className="text-accent-400 hover:underline">Register</Link>
        </p>
        <p className="text-center text-[11px] text-slate-600 mt-3">
          Demo: admin@atoshield.dev / yashu@atoshield.dev — password Password123!
        </p>
      </div>
    </div>
  )
}
