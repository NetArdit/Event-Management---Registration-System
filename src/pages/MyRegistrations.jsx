import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { formatDate, formatTimeRange } from '../utils/formatters'
import { STATUS_LABELS, statusBadgeClass } from '../utils/eventHelpers'
import './MyRegistrations.css'

const TABS = [
  { key: 'active', label: 'Registered' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function MyRegistrations() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadRegistrations() {
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
    } catch (err) {
      setError(err.message || 'Failed to load your registrations.')
    } finally {
      setLoading(false)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const { error: cancelError } = await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .eq('id', cancelTarget.id)

      if (cancelError) throw cancelError
      setCancelTarget(null)
      await loadRegistrations()
    } catch (err) {
      setError(err.message || 'Failed to cancel registration.')
    } finally {
      setCancelling(false)
    }
  }

  const filtered = registrations.filter((row) =>
    tab === 'active' ? row.status === 'registered' : row.status === 'cancelled'
  )

  if (loading) return <LoadingState label="Loading your registrations…" />
  if (error) return <ErrorState message={error} onRetry={loadRegistrations} />

  return (
    <div className="container page-section">
      <div className="page-header">
        <h1>My Registrations</h1>
        <p>Track the events you&rsquo;ve signed up for.</p>
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={`tab ${tab === item.key ? 'tab-active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={tab === 'active' ? 'No active registrations' : 'No cancelled registrations'}
          message={tab === 'active' ? 'Browse events and register to see them here.' : undefined}
          action={
            tab === 'active' ? (
              <Link to="/events" className="btn btn-primary">
                Browse Events
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="registration-list">
          {filtered.map((row) => (
            <li key={row.id} className="registration-item card">
              <div className="registration-item-main">
                <div className="registration-item-top">
                  <Link to={`/events/${row.events.id}`}>{row.events?.title || 'Untitled event'}</Link>
                  <span className={statusBadgeClass(row.events?.status)}>
                    {STATUS_LABELS[row.events?.status]}
                  </span>
                </div>
                <p className="registration-item-meta">
                  {formatDate(row.events?.event_date)} · {formatTimeRange(row.events?.start_time, row.events?.end_time)}
                </p>
                <p className="registration-item-meta">{row.events?.location}</p>
              </div>
              {tab === 'active' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setCancelTarget(row)}>
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {cancelTarget && (
        <Modal title="Cancel registration?" onClose={() => setCancelTarget(null)}>
          <p>
            Are you sure you want to cancel your registration for{' '}
            <strong>{cancelTarget.events?.title}</strong>? You can register again later if space is available.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setCancelTarget(null)}>
              Keep registration
            </button>
            <button className="btn btn-danger" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
