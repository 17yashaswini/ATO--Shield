import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LoginHistory from './pages/LoginHistory'
import Sessions from './pages/Sessions'
import SecurityEvents from './pages/SecurityEvents'
import SecurityCheck from './pages/SecurityCheck'
import Recovery from './pages/Recovery'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminEvents from './pages/AdminEvents'
import AttackSimulator from './pages/AttackSimulator'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login-history" element={<LoginHistory />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/security-events" element={<SecurityEvents />} />
          <Route path="/security-check" element={<SecurityCheck />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/simulator" element={<AttackSimulator />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
