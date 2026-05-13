const severityToClass = {
  high: 'high',
  medium: 'medium',
  low: 'low',
}

function toPercent(value, fallback = 0) {
  if (value == null || Number.isNaN(Number(value))) return fallback
  const num = Number(value)
  if (num <= 1) return num * 100
  return num
}

export function IssueOverlay({ issue, selected, onClick, overlayId }) {
  if (issue?.hasLocation === false) {
    return null
  }

  const loc = issue.location || {}
  const top = toPercent(loc.y)
  const left = toPercent(loc.x)
  const width = Math.max(toPercent(loc.width, 10), 2)
  const height = Math.max(toPercent(loc.height, 6), 2)
  const severityClass = severityToClass[String(issue.severity || 'low').toLowerCase()] || 'low'

  return (
    <button
      type="button"
      className={`issue-overlay ${severityClass} ${selected ? 'active' : ''}`}
      style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
      title={`${issue.title || 'Issue'} (${issue.severity || 'Low'})`}
      onClick={() => onClick?.(issue, overlayId)}
      aria-label={issue.title || 'Issue overlay'}
    />
  )
}
