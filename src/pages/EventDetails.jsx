import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import RegistrationButton from '../components/RegistrationButton'
import { formatDate, formatTimeRange } from '../utils/formatters'
import { STATUS_LABELS, statusBadgeClass, spotsRemaining } from '../utils/eventHelpers'
import './EventDetails.css'

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [registeredCount, setRegisteredCount] = useState(0)
  const [myRegistration, setMyRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  async function loadEvent() {
    setLoading(true)
    setError('')
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          setEvent(null)
          setLoading(false)
          return
        }
        throw eventError
      }

      const { data: registrationRows, error: registrationsError } = await supabase
        .from('registrations')
        .select('id, user_id, status')
        .eq('event_id', id)

      if (registrationsError) throw registrationsError

      const activeCount = registrationRows.filter((row) => row.status === 'registered').length
      const mine = user ? registrationRows.find((row) => row.user_id === user.id) : null

      setEvent(eventData)
      setRegisteredCount(activeCount)
      setMyRegistration(mine || null)
    } catch (err) {
      setError(err.message || 'Failed to load this event.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState label="Loading event…" />
  if (error) return <ErrorState message={error} onRetry={loadEvent} />
  if (!event) return <ErrorState title="Event not found" message="This event may have been removed." />

  const spotsLeft = spotsRemaining(event, registeredCount)

  return (
    <div className="container page-section event-details">
      <Link to="/events" className="back-link">
        &larr; Back to events
      </Link>

      {event.image_url && (
        <div className="event-details-image">
          <img src={event.image_url} alt="" />
        </div>
      )}

      <div className="event-details-header">
        <span className={statusBadgeClass(event.status)}>{STATUS_LABELS[event.status]}</span>
        <span className="badge badge-neutral">{event.category}</span>
      </div>

      <h1>{event.title}</h1>

      <div className="event-details-grid">
        <div className="event-details-main">
          <h2>About this event</h2>
          <p className="event-description">{event.description}</p>
        </div>

        <aside className="event-details-sidebar card">
          <dl className="event-facts">
            <div>
              <dt>Date</dt>
              <dd>{formatDate(event.event_date)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatTimeRange(event.start_time, event.end_time)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{event.location}</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>
                {registeredCount} / {event.capacity} registered
                {spotsLeft > 0 && event.status === 'upcoming' ? ` · ${spotsLeft} left` : ''}
              </dd>
            </div>
          </dl>

          <RegistrationButton
            event={event}
            registeredCount={registeredCount}
            myRegistration={myRegistration}
            onChange={loadEvent}
          />
        </aside>
      </div>
    </div>
  )
}
