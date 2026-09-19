import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import { formatDate, formatTimeRange } from '../../utils/formatters'
import './Admin.css'

export default function AdminEventRegistrations() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [eventResult, registrationsResult] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase
          .from('registrations')
          .select('id, status, registered_at, profiles(full_name, email)')
          .eq('event_id', id)
          .order('registered_at', { ascending: false }),
      ])

      if (eventResult.error) throw eventResult.error
      if (registrationsResult.error) throw registrationsResult.error

      setEvent(eventResult.data)
      setRegistrations(registrationsResult.data)
    } catch (err) {
      setError(err.message || 'Failed to load registrations.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(registration) {
    const nextStatus = registration.status === 'registered' ? 'cancelled' : 'registered'
    setUpdatingId(registration.id)
    try {
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ status: nextStatus })
        .eq('id', registration.id)
      if (updateError) throw updateError
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to update registration.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <LoadingState label="Loading registrations…" />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  const activeCount = registrations.filter((row) => row.status === 'registered').length

  return (
    <div className="container page-section">
      <Link to="/admin/events" className="back-link">
        &larr; Back to Manage Events
      </Link>

      <div className="page-header">
        <h1>{event?.title}</h1>
        <p>
          {formatDate(event?.event_date)} · {formatTimeRange(event?.start_time, event?.end_time)} ·{' '}
          {activeCount} / {event?.capacity} registered
        </p>
      </div>

      {registrations.length === 0 ? (
        <EmptyState title="No registrations yet" message="No one has registered for this event." />
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((row) => (
                <tr key={row.id}>
                  <td>{row.profiles?.full_name || '—'}</td>
                  <td>{row.profiles?.email || '—'}</td>
                  <td>{new Date(row.registered_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${row.status === 'registered' ? 'registered' : 'cancelled'}`}>
                      {row.status === 'registered' ? 'Registered' : 'Cancelled'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleStatus(row)}
                      disabled={updatingId === row.id}
                    >
                      {row.status === 'registered' ? 'Cancel' : 'Reinstate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
