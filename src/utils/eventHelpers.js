export const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled']

export const STATUS_LABELS = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function statusBadgeClass(status) {
  return `badge badge-${status}`
}

export function spotsRemaining(event, registeredCount) {
  return Math.max(event.capacity - registeredCount, 0)
}

export function isEventFull(event, registeredCount) {
  return registeredCount >= event.capacity
}

export function canRegister(event, registeredCount) {
  return event.status !== 'cancelled' && event.status !== 'completed' && !isEventFull(event, registeredCount)
}
