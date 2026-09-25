import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EventForm from '../../components/EventForm'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import './Admin.css'

export default function AdminEventForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [initialValues, setInitialValues] = useState(isEditing ? null : undefined)
  const [loading, setLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (isEditing) loadEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadEvent() {
    setLoading(true)
    setLoadError('')
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Event not found.')
      setInitialValues({
        ...data,
        start_time: data.start_time?.slice(0, 5),
        end_time: data.end_time?.slice(0, 5),
      })
    } catch (err) {
      setLoadError(err.message || 'Failed to load event.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(formValues) {
    setSubmitting(true)
    setSubmitError('')
    try {
      if (isEditing) {
        const { error } = await supabase.from('events').update(formValues).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('events').insert({ ...formValues, created_by: user.id })
        if (error) throw error
      }
      navigate('/admin/events')
    } catch (err) {
      setSubmitError(err.message || 'Failed to save event.')
      setSubmitting(false)
    }
  }

  if (isEditing && loading) return <LoadingState label="Loading event…" />
  if (isEditing && loadError) return <ErrorState message={loadError} onRetry={loadEvent} />

  return (
    <div className="container page-section">
      <Link to="/admin/events" className="back-link">
        &larr; Back to Manage Events
      </Link>
      <div className="page-header">
        <h1>{isEditing ? 'Edit Event' : 'Create Event'}</h1>
      </div>

      {submitError && <p className="form-error-banner">{submitError}</p>}

      <EventForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={isEditing ? 'Save Changes' : 'Create Event'}
      />
    </div>
  )
}
