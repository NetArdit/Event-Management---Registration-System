export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(timeString) {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes))
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatTimeRange(startTime, endTime) {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}

export function formatDateTime(dateString, startTime, endTime) {
  return `${formatDate(dateString)} · ${formatTimeRange(startTime, endTime)}`
}
