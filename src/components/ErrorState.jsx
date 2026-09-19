import './States.css'

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-block state-block-error" role="alert">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
