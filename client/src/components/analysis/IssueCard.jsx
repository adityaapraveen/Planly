import { getIssueStableId } from './issue-id'

export function IssueCard({ issue, index, selected, onClick }) {
  const id = getIssueStableId(issue, index)
  return (
    <button
      type="button"
      className={`issue-card ${selected ? 'active' : ''}`}
      onClick={() => onClick?.(issue, id)}
    >
      <div className="issue-card-head">
        <h4>{issue.title || `Issue ${index + 1}`}</h4>
        <span className={`sev ${String(issue.severity || 'low').toLowerCase()}`}>
          {issue.severity || 'Low'}
        </span>
      </div>
      <p className="meta">Page {issue.page || 1} · {issue.category || 'General'}</p>
      {issue.hasLocation === false && <p className="meta">No pinpoint location available on drawing.</p>}
      {issue.explanation && <p>{issue.explanation}</p>}
      {issue.recommendation && <p className="recommendation">Recommendation: {issue.recommendation}</p>}
      {issue.confidence != null && <p className="meta">Confidence: {Math.round(Number(issue.confidence) * 100)}%</p>}
    </button>
  )
}
