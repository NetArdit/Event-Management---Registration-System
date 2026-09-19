import './StatCard.css'

export default function StatCard({ label, value }) {
  return (
    <div className="stat-card card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
