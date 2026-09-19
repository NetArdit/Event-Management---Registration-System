import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user, profile, isAdmin, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError('Full name cannot be empty.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await refreshProfile()
    setSuccess('Profile updated.')
  }

  return (
    <div className="container page-section">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your basic account information.</p>
      </div>

      <div className="card profile-card">
        {error && <p className="form-error-banner">{error}</p>}
        {success && <p className="form-success-banner">{success}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" value={user?.email || ''} disabled />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <span className="badge badge-neutral">{isAdmin ? 'Admin' : 'User'}</span>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
