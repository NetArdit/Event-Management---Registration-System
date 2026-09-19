import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container page-section" style={{ textAlign: 'center', paddingTop: 'var(--space-7)' }}>
      <h1>404</h1>
      <p>The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <Link to="/" className="btn btn-primary">
        Go home
      </Link>
    </div>
  )
}
