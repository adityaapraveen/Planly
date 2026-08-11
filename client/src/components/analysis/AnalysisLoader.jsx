import { Spinner } from '../ui/Spinner'

const copyMap = {
  PENDING: 'Waiting for analysis to start',
  PROCESSING: 'AI is reviewing this drawing',
}

export function AnalysisLoader({ status }) {
  return (
    <div className="analysis-loader-card">
      <Spinner />
      <div>
        <h3>{copyMap[status] || 'Loading report'}</h3>
        <p>This can take a little while depending on page count.</p>
      </div>
    </div>
  )
}
