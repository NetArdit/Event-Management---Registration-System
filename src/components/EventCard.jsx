import { Link } from 'react-router-dom'
import { formatDate, formatTimeRange } from '../utils/formatters'
import { STATUS_LABELS, statusBadgeClass, spotsRemaining } from '../utils/eventHelpers'
import './EventCard.css'

export default function EventCard({ event, registeredCount = 0, userRegistrationStatus }) {
  const spotsLeft = spotsRemaining(event, registeredCount)

  return (
    <Link to={`/events/${event.id}`} className="event-card card">
      {event.image_url && (
        <div className="event-card-image">
          <img src={event.image_url} alt="" />
        </div>
      )}
      <div className="event-card-body">
        <div className="event-card-top">
          <span className={statusBadgeClass(event.status)}>{STATUS_LABELS[event.status]}</span>
          {userRegistrationStatus === 'registered' && (
            <span className="badge badge-registered">You&rsquo;re registered</span>
          )}
        </div>

        <h3 className="event-card-title">{event.title}</h3>

        <p className="event-card-meta">{formatDate(event.event_date)}</p>
        <p className="event-card-meta">{formatTimeRange(event.start_time, event.end_time)}</p>
        <p className="event-card-meta">{event.location}</p>

        <div className="event-card-footer">
          <span className="badge badge-neutral">{event.category}</span>
          <span className="event-card-capacity">
            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Full'}
          </span>
        </div>
      </div>
    </Link>
  )
}
