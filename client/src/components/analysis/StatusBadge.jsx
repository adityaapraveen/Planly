const statusMap = {
  PENDING: 'status-pending',
  PROCESSING: 'status-processing',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
}

export function StatusBadge({ status }) {
  const cls = statusMap[status] || 'status-pending'
  return <span className={`analysis-status-badge ${cls}`}>{status || 'UNKNOWN'}</span>
}
