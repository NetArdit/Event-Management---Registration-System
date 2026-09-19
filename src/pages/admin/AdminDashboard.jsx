import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import StatCard from '../../components/StatCard'
import './Admin.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    setError('')
    try {
      const [totalEvents, upcomingEvents, totalRegistrations, totalUsers] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'upcoming'),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'registered'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])

      const firstError =
        totalEvents.error || upcomingEvents.error || totalRegistrations.error || totalUsers.error
      if (firstError) throw firstError

      setStats({
        totalEvents: totalEvents.count,
        upcomingEvents: upcomingEvents.count,
        totalRegistrations: totalRegistrations.count,
        totalUsers: totalUsers.count,
      })
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState label="Loading admin dashboard…" />
  if (error) return <ErrorState message={error} onRetry={loadStats} />

  return (
    <div className="container page-section">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of events and registrations.</p>
      </div>

      <div className="dashboard-stats">
        <StatCard label="Total events" value={stats.totalEvents} />
        <StatCard label="Upcoming events" value={stats.upcomingEvents} />
        <StatCard label="Active registrations" value={stats.totalRegistrations} />
        <StatCard label="Total users" value={stats.totalUsers} />
      </div>

      <section className="page-section">
        <h2>Quick actions</h2>
        <div className="admin-quick-actions">
          <Link to="/admin/events" className="btn btn-secondary">
            Manage Events
          </Link>
          <Link to="/admin/events/new" className="btn btn-primary">
            Create Event
          </Link>
        </div>
      </section>
    </div>
  )
}
