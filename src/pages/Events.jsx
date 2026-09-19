import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { EVENT_STATUSES, STATUS_LABELS } from '../utils/eventHelpers'
import './Events.css'

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [registrationCounts, setRegistrationCounts] = useState({})
  const [myRegistrations, setMyRegistrations] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadEvents() {
    setLoading(true)
    setError('')
    try {
      const { data: eventRows, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError

      const ids = eventRows.map((event) => event.id)
      const counts = {}
      const mine = {}

      if (ids.length > 0) {
        const { data: registrationRows, error: registrationsError } = await supabase
          .from('registrations')
          .select('event_id, status, user_id')
          .in('event_id', ids)

        if (registrationsError) throw registrationsError

        registrationRows.forEach((row) => {
          if (row.status === 'registered') {
            counts[row.event_id] = (counts[row.event_id] || 0) + 1
          }
          if (user && row.user_id === user.id) {
            mine[row.event_id] = row.status
          }
        })
      }

      setEvents(eventRows)
      setRegistrationCounts(counts)
      setMyRegistrations(mine)
    } catch (err) {
      setError(err.message || 'Failed to load events.')
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const unique = new Set(events.map((event) => event.category).filter(Boolean))
    return Array.from(unique).sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(search.trim().toLowerCase())
      const matchesCategory = category === 'all' || event.category === category
      const matchesStatus = status === 'all' || event.status === status
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [events, search, category, status])

  return (
    <div className="container page-section">
      <div className="page-header">
        <h1>Browse Events</h1>
        <p>Find and register for upcoming university events.</p>
      </div>

      <div className="events-filters">
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search events by title"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {EVENT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingState label="Loading events…" />}
      {!loading && error && <ErrorState message={error} onRetry={loadEvents} />}
      {!loading && !error && filteredEvents.length === 0 && (
        <EmptyState title="No events found" message="Try adjusting your search or filters." />
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registeredCount={registrationCounts[event.id] || 0}
              userRegistrationStatus={myRegistrations[event.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
