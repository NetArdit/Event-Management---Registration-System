import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { formatDate } from '../../utils/formatters'
import { STATUS_LABELS, statusBadgeClass } from '../../utils/eventHelpers'
import './Admin.css'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    setError('')
    try {
      const { data, error: loadError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

      if (loadError) throw loadError
      setEvents(data)
    } catch (err) {
      setError(err.message || 'Failed to load events.')
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('events').delete().eq('id', deleteTarget.id)
      if (deleteError) throw deleteError
      setDeleteTarget(null)
      await loadEvents()
    } catch (err) {
      setError(err.message || 'Failed to delete event.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <LoadingState label="Loading events…" />
  if (error) return <ErrorState message={error} onRetry={loadEvents} />

  return (
    <div className="container page-section">
      <div className="admin-toolbar">
        <div>
          <h1>Manage Events</h1>
          <p>Create, edit, and remove events.</p>
        </div>
        <Link to="/admin/events/new" className="btn btn-primary">
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          message="Create your first event to get started."
          action={
            <Link to="/admin/events/new" className="btn btn-primary">
              Create Event
            </Link>
          }
        />
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Category</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.category}</td>
                  <td>{event.capacity}</td>
                  <td>
                    <span className={statusBadgeClass(event.status)}>{STATUS_LABELS[event.status]}</span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Link to={`/admin/events/${event.id}/registrations`} className="btn btn-secondary btn-sm">
                        Registrations
                      </Link>
                      <Link to={`/admin/events/${event.id}/edit`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(event)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <Modal title="Delete event?" onClose={() => setDeleteTarget(null)}>
          <p>
            Are you sure you want to permanently delete <strong>{deleteTarget.title}</strong>? This will also
            remove all registrations for this event. This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete event'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
