import { getRealStatus } from '../lib/eventStatus'

export const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled']

export const STATUS_LABELS = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function statusBadgeClass(status) {
  return `badge status-${status}`
}

export function spotsRemaining(event, registeredCount) {
  return Math.max(event.capacity - registeredCount, 0)
}

export function isEventFull(event, registeredCount) {
  return registeredCount >= event.capacity
}

export function canRegister(event, registeredCount) {
  return getRealStatus(event) === 'upcoming' && !isEventFull(event, registeredCount)
}
