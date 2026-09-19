import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { canRegister, isEventFull } from '../utils/eventHelpers'

export default function RegistrationButton({ event, registeredCount, myRegistration, onChange }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <Link to="/login" className="btn btn-primary btn-block">
        Log in to register
      </Link>
    )
  }

  const isRegistered = myRegistration?.status === 'registered'

  async function handleRegister() {
    setSubmitting(true)
    setError('')
    try {
      let result
      if (myRegistration) {
        result = await supabase
          .from('registrations')
          .update({ status: 'registered' })
          .eq('id', myRegistration.id)
      } else {
        result = await supabase
          .from('registrations')
          .insert({ event_id: event.id, user_id: user.id, status: 'registered' })
      }
      if (result.error) throw result.error
      onChange()
    } catch (err) {
      setError(err.message || 'Could not complete registration.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    setSubmitting(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .eq('id', myRegistration.id)
      if (updateError) throw updateError
      onChange()
    } catch (err) {
      setError(err.message || 'Could not cancel registration.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <div>
        <button className="btn btn-danger btn-block" onClick={handleCancel} disabled={submitting}>
          {submitting ? 'Cancelling…' : 'Cancel Registration'}
        </button>
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }

  if (event.status === 'cancelled') {
    return <p className="field-error">This event has been cancelled.</p>
  }

  if (event.status === 'completed') {
    return <p className="field-error">This event has already ended.</p>
  }

  if (isEventFull(event, registeredCount)) {
    return (
      <button className="btn btn-secondary btn-block" disabled>
        Event Full
      </button>
    )
  }

  return (
    <div>
      <button
        className="btn btn-primary btn-block"
        onClick={handleRegister}
        disabled={submitting || !canRegister(event, registeredCount)}
      >
        {submitting ? 'Registering…' : 'Register for this event'}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
