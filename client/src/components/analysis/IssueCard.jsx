import { CheckCircle2, Clock3, Copy, Sparkles } from 'lucide-react'
import { getIssueStableId } from './issue-id'

const statusLabels = {
  OPEN: 'Unreviewed',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
}

function formatReviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

export function IssueCard({ issue, index, selected, onClick, onStatusChange, onCopyLink }) {
  const id = getIssueStableId(issue, index)
  const reviewed = issue.status && issue.status !== 'OPEN'

  return (
    <article className={`issue-card ${selected ? 'active' : ''}`}>
      <button type="button" className="issue-card-main" onClick={() => onClick?.(issue, id)}>
        <div className="issue-card-head">
          <h4>{issue.title || `Issue ${index + 1}`}</h4>
          <span className={`sev ${String(issue.severity || 'low').toLowerCase()}`}>
            {issue.severity || 'Low'}
          </span>
        </div>
        <div className={`finding-origin ${reviewed ? 'reviewed' : ''}`}>
          {reviewed ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
          {reviewed ? `Human ${statusLabels[issue.status]?.toLowerCase()}` : 'AI-assisted · review required'}
        </div>
        <p className="meta">Page {issue.page || 1} · {issue.category || 'General'}</p>
        {issue.hasLocation === false && <p className="meta">No pinpoint location available on drawing.</p>}
        {issue.explanation && <p>{issue.explanation}</p>}
        {issue.recommendation && <p className="recommendation">Recommendation: {issue.recommendation}</p>}
        {issue.confidence != null && <p className="meta">Model confidence: {Math.round(Number(issue.confidence) * 100)}% · not a calibrated probability</p>}
      </button>

      {issue.reviewReason && (
        <div className="finding-review-summary">
          <strong>Reviewer rationale</strong>
          <p>{issue.reviewReason}</p>
          {issue.reviewerNote && <p>{issue.reviewerNote}</p>}
          {issue.reviewedAt && <small><Clock3 size={11} /> {formatReviewDate(issue.reviewedAt)}</small>}
        </div>
      )}

      {issue.reviewEvents?.length > 0 && (
        <details className="finding-history">
          <summary>{issue.reviewEvents.length} audit {issue.reviewEvents.length === 1 ? 'event' : 'events'}</summary>
          <ol>
            {issue.reviewEvents.map((event) => (
              <li key={event.id}>
                <strong>{statusLabels[event.status] || event.status}</strong>
                <span>{event.reviewer?.name || 'Reviewer'} · {formatReviewDate(event.reviewedAt)}</span>
                {event.reason && <p>{event.reason}</p>}
                {event.note && <p>{event.note}</p>}
              </li>
            ))}
          </ol>
        </details>
      )}

      {issue.id && (
        <div className="issue-status-field">
          <label>
            <span>Human decision</span>
            <select value={issue.status || 'OPEN'} onChange={(event) => onStatusChange?.(issue, event.target.value)}>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledge</option>
              <option value="RESOLVED">Resolve</option>
              <option value="DISMISSED">Dismiss</option>
            </select>
          </label>
          <button type="button" className="finding-copy-link" onClick={() => onCopyLink?.(issue)} aria-label={`Copy link to ${issue.title}`}>
            <Copy size={13} /> Copy link
          </button>
        </div>
      )}
    </article>
  )
}
