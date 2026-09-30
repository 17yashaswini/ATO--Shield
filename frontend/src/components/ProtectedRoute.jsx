import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from './LoadingState'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState label="Loading..." />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <LoadingState label="Loading..." />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
