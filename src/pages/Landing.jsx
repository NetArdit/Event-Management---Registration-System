import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import { getRealStatus } from '../lib/eventStatus'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import './Landing.css'

const UPCOMING_EVENTS_LIMIT = 3

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Browse',
    description: 'Explore events happening across campus, filtered and searchable by title, category, and status.',
  },
  {
    number: '02',
    title: 'Register',
    description: 'Open an event you like and register in one step, as long as there is space available.',
  },
  {
    number: '03',
    title: 'Attend',
    description: 'Keep track of everything you’ve registered for from your dashboard, and cancel any time if your plans change.',
  },
]

const FEATURES = [
  {
    title: 'Discover Events',
    description: 'Search by title and filter by category or status to quickly find events that interest you.',
  },
  {
    title: 'Register for Events',
    description: 'Register directly from an event’s details page, with capacity and availability shown up front.',
  },
  {
    title: 'Manage Registrations',
    description: 'View every event you’ve registered for, see its status, and cancel a registration if you can no longer attend.',
  },
  {
    title: 'Track Upcoming Events',
    description: 'Your dashboard summarizes your upcoming registered events and recent activity in one place.',
  },
]

const ADMIN_CAPABILITIES = [
  'Create and edit events, including schedule, location, category, and capacity',
  'Cancel or delete events when plans change',
  'View the full list of participants registered for any event',
  'Manage a participant’s registration status directly',
  'Monitor event activity through a dedicated admin dashboard',
]

export default function Landing() {
  const { user, isAdmin } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUpcomingEvents()
  }, [])

  async function loadUpcomingEvents() {
    setLoading(true)
    setError('')
    try {
      // Events are publicly readable; this page never queries registrations
      // or profiles, which are private to their owners and admins.
      const { data, error: loadError } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, end_time, location, category, capacity, image_url, status')
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true })
        .limit(UPCOMING_EVENTS_LIMIT)

      if (loadError) throw loadError
      setEvents(data.filter((event) => getRealStatus(event) === 'upcoming'))
    } catch (err) {
      setError(err.message || 'Failed to load upcoming events.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="container landing-hero-inner">
          <span className="landing-eyebrow">Campus Events Platform</span>
          <h1>Discover Events. Connect. Participate.</h1>
          <p className="landing-hero-text">
            Browse university events, see what&rsquo;s happening and where, and register in a few
            clicks. Keep track of everything you&rsquo;ve signed up for from one place.
          </p>
          <div className="landing-actions">
            <Link to="/events" className="btn btn-primary">
              Explore Events
            </Link>
            {user ? (
              <Link to="/dashboard" className="btn btn-secondary">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/register" className="btn btn-secondary">
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <h2>Upcoming Events</h2>
            <p>A few of the events open for registration right now.</p>
          </div>

          {loading && <LoadingState label="Loading upcoming events…" />}

          {!loading && error && (
            <ErrorState message={error} onRetry={loadUpcomingEvents} />
          )}

          {!loading && !error && events.length === 0 && (
            <EmptyState
              title="No upcoming events right now"
              message="Check back soon, or browse the full events list."
            />
          )}

          {!loading && !error && events.length > 0 && (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <div className="landing-section-cta">
                <Link to="/events" className="btn btn-outline">
                  View All Events
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="landing-section landing-section-muted">
        <div className="container">
          <div className="landing-section-header">
            <h2>How It Works</h2>
            <p>Getting to your next event takes three simple steps.</p>
          </div>

          <div className="how-it-works-grid">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div className="how-it-works-step" key={step.number}>
                <span className="how-it-works-number" aria-hidden="true">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <h2>What You Can Do</h2>
            <p>Everything you need to find and manage your event registrations.</p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <div className="feature-card card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="admin-section card">
            <div className="admin-section-text">
              <h2>For Event Administrators</h2>
              <p>Manage events with ease, from creation through to attendance.</p>
              <ul className="admin-capabilities">
                {ADMIN_CAPABILITIES.map((capability) => (
                  <li key={capability}>{capability}</li>
                ))}
              </ul>
            </div>
            <div className="admin-section-action">
              {isAdmin ? (
                <Link to="/admin" className="btn btn-primary">
                  Go to Admin Dashboard
                </Link>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta-section">
        <div className="container">
          <div className="landing-final-cta">
            <h2>Ready to discover your next event?</h2>
            <p>Explore available events and find something worth attending.</p>
            <div className="landing-actions">
              <Link to="/events" className="btn btn-primary">
                Explore Events
              </Link>
              {!user && (
                <Link to="/register" className="btn btn-secondary">
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
