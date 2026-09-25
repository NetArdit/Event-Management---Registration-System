// The `status` column in the database is static, so the real status is derived
// from the event date and times. Only 'cancelled' is trusted from the database.
export function getRealStatus(event) {
  if (!event) return 'upcoming'
  if (event.status === 'cancelled') return 'cancelled'

  const now = new Date()
  const start = new Date(`${event.event_date}T${event.start_time}`)
  const end = new Date(`${event.event_date}T${event.end_time}`)

  if (now > end) return 'completed'
  if (now >= start && now <= end) return 'ongoing'
  return 'upcoming'
}

export function getStatusLabel(status) {
  const labels = {
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

export function getStatusClass(status) {
  return `status-${status}`
}
