import api from './api'

export async function getAdminDashboard() {
  const res = await api.get('/admin/dashboard')
  return res.data.data
}

export async function getAdminUsers() {
  const res = await api.get('/admin/users')
  return res.data.data
}

export async function getAdminEvents() {
  const res = await api.get('/admin/events')
  return res.data.data
}

export async function getAdminLoginEvents() {
  const res = await api.get('/admin/login-events')
  return res.data.data
}

export async function runSimulation(scenario, targetUserId) {
  const res = await api.post('/admin/simulate', { scenario, target_user_id: targetUserId })
  return res.data.data
}
