import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import EventCard from '../components/EventCard'
import { getRealStatus } from '../lib/eventStatus'
import './Dashboard.css'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [registrationCounts, setRegistrationCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const { data, error: loadError } = await supabase
        .from('registrations')
        .select('id, status, registered_at, events(*)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })

      if (loadError) throw loadError
      setRegistrations(data)

      const eventIds = data.map((row) => row.events?.id).filter(Boolean)
      if (eventIds.length > 0) {
        const { data: countRows, error: countsError } = await supabase
          .from('registrations')
          .select('event_id')
          .eq('status', 'registered')
          .in('event_id', eventIds)

        if (countsError) throw countsError
        const counts = {}
        countRows.forEach((row) => {
          counts[row.event_id] = (counts[row.event_id] || 0) + 1
        })
        setRegistrationCounts(counts)
      }
    } catch (err) {
      setError(err.message || 'Failed to load your dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const active = useMemo(() => registrations.filter((row) => row.status === 'registered'), [registrations])

  const upcoming = useMemo(
    () =>
      active
        .filter((row) => row.events && ['upcoming', 'ongoing'].includes(getRealStatus(row.events)))
        .sort((a, b) => new Date(a.events.event_date) - new Date(b.events.event_date))
        .slice(0, 6),
    [active]
  )

  const recentlyRegistered = useMemo(() => registrations.slice(0, 5), [registrations])

  if (loading) return <LoadingState label="Loading your dashboard…" />
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />

  return (
    <div className="container page-section">
      <div className="page-header">
        <h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
        <p>Here&rsquo;s a summary of your event activity.</p>
      </div>

      <div className="dashboard-stats">
        <StatCard label="Active registrations" value={active.length} />
        <StatCard label="Upcoming events" value={upcoming.length} />
        <StatCard label="Total registrations" value={registrations.length} />
      </div>

      <section className="page-section">
        <h2>Your upcoming events</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            message="You haven't registered for any upcoming events yet."
            action={
              <Link to="/events" className="btn btn-primary">
                Browse Events
              </Link>
            }
          />
        ) : (
          <div className="events-grid">
            {upcoming.map((row) => (
              <EventCard
                key={row.id}
                event={row.events}
                registeredCount={registrationCounts[row.events.id] || 0}
                userRegistrationStatus={row.status}
              />
            ))}
          </div>
        )}
      </section>

      <section className="page-section">
        <h2>Recent activity</h2>
        {recentlyRegistered.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ul className="activity-list card">
            {recentlyRegistered.map((row) => (
              <li key={row.id}>
                <span>{row.events?.title || 'Untitled event'}</span>
                <span className={`badge badge-${row.status === 'registered' ? 'registered' : 'cancelled'}`}>
                  {row.status === 'registered' ? 'Registered' : 'Cancelled'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
