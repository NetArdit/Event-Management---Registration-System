import './States.css'

export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
