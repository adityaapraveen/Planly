import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import './ErrorState.css'

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <AlertTriangle size={24} />
      </div>
      <h3>Error</h3>
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
