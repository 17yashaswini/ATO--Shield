import api from './api'
import { getOrCreateDeviceId, getDeviceName } from '../utils/device'

export async function registerUser({ name, email, password }) {
  const res = await api.post('/auth/register', { name, email, password })
  return res.data.data
}

export async function loginUser({ email, password, location, failedAttempts = 0 }) {
  const res = await api.post('/auth/login', {
    email,
    password,
    device_id: getOrCreateDeviceId(),
    device_name: getDeviceName(),
    location: location || 'Bengaluru, IN',
    failed_attempts: failedAttempts,
  })
  return res.data.data
}

export async function fetchMe() {
  const res = await api.get('/auth/me')
  return res.data.data
}

export async function logoutUser() {
  await api.post('/auth/logout')
}
