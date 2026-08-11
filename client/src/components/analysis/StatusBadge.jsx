const statusMap = {
  PENDING: 'status-pending',
  PROCESSING: 'status-processing',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
  NOT_STARTED: 'status-pending',
}

export function StatusBadge({ status }) {
  const cls = statusMap[status] || 'status-pending'
  const label = status === 'NOT_STARTED' ? 'NOT STARTED' : (status || 'UNKNOWN')
  return <span className={`analysis-status-badge ${cls}`}>{label}</span>
}
