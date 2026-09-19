import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { data, error: signUpError } = await signUp(email, password, fullName)
    setSubmitting(false)

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'An account with this email already exists.'
          : signUpError.message
      )
      return
    }

    if (data.session) {
      navigate('/dashboard', { replace: true })
      return
    }

    // When email confirmations are disabled, Supabase does not return an error
    // for a duplicate email (to avoid leaking which emails are registered) —
    // instead it returns a fake "pending" user with an empty identities array.
    // Without this check, the form would wrongly tell an existing user to
    // "check their email" for a signup that never happened.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists. Try logging in instead.')
      return
    }

    setInfo('Account created. Check your email to confirm your account before logging in.')
  }

  return (
    <div className="container auth-page">
      <div className="card auth-card">
        <h1>Create an account</h1>
        {error && <p className="form-error-banner">{error}</p>}
        {info && <p className="form-success-banner">{info}</p>}
        {!info && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        )}
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
