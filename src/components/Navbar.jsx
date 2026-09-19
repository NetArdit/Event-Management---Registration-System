import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          Campus Events
        </Link>

        <button
          className="navbar-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-links ${menuOpen ? 'is-open' : ''}`}>
          <NavLink to="/events" onClick={closeMenu}>
            Browse Events
          </NavLink>

          {user && (
            <NavLink to="/dashboard" onClick={closeMenu}>
              Dashboard
            </NavLink>
          )}
          {user && (
            <NavLink to="/my-registrations" onClick={closeMenu}>
              My Registrations
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenu}>
              Admin
            </NavLink>
          )}

          <div className="navbar-divider" />

          {user ? (
            <>
              <NavLink to="/profile" onClick={closeMenu}>
                {profile?.full_name || 'Profile'}
              </NavLink>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>
                Log in
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
