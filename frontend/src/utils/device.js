function getOrCreateDeviceId() {
  let id = localStorage.getItem('ato_shield_device_id')
  if (!id) {
    id = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('ato_shield_device_id', id)
  }
  return id
}

function getDeviceName() {
  const ua = navigator.userAgent
  let browser = 'Unknown Browser'
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Safari/')) browser = 'Safari'

  let os = 'Unknown Device'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'Mac'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return `${os} - ${browser}`
}

export { getOrCreateDeviceId, getDeviceName }
