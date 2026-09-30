import api from './api'

export async function getSecurityScore() {
  const res = await api.get('/users/security-score')
  return res.data.data
}

export async function getLoginHistory(limit = 50) {
  const res = await api.get(`/users/login-history?limit=${limit}`)
  return res.data.data
}

export async function getSessions() {
  const res = await api.get('/sessions')
  return res.data.data
}

export async function revokeSession(sessionId) {
  const res = await api.post(`/sessions/${sessionId}/revoke`)
  return res.data
}

export async function revokeOtherSessions() {
  const res = await api.post('/sessions/revoke-others')
  return res.data
}

export async function getSecurityEvents() {
  const res = await api.get('/security/events')
  return res.data.data
}

export async function getSecurityEventDetail(eventId) {
  const res = await api.get(`/security/events/${eventId}`)
  return res.data.data
}

export async function confirmEvent(eventId) {
  const res = await api.post(`/security/events/${eventId}/confirm`)
  return res.data
}

export async function reportEvent(eventId) {
  const res = await api.post(`/security/events/${eventId}/report`)
  return res.data.data
}

export async function getRecommendations() {
  const res = await api.get('/security/recommendations')
  return res.data.data
}

export async function getTimeline() {
  const res = await api.get('/security/timeline')
  return res.data.data
}

export async function startRecovery() {
  const res = await api.post('/recovery/start')
  return res.data.data
}

export async function recoveryAction(step, extra = {}) {
  const res = await api.post('/recovery/action', { step, ...extra })
  return res.data.data
}

export async function getNotifications() {
  const res = await api.get('/notifications')
  return res.data.data
}
