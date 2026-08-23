import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { IssueCard } from './IssueCard'
import { getIssueStableId } from './issue-id'

const severityRank = { high: 3, medium: 2, low: 1 }

export function IssueSidebar({
  issues,
  selectedIssueId,
  onSelectIssue,
  onStatusChange,
  onCopyLink,
  onExport,
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')

  const counts = useMemo(() => ({
    high: issues.filter((issue) => String(issue.severity || '').toLowerCase() === 'high').length,
    active: issues.filter((issue) => ['OPEN', 'ACKNOWLEDGED'].includes(issue.status || 'OPEN')).length,
    decided: issues.filter((issue) => ['RESOLVED', 'DISMISSED'].includes(issue.status)).length,
  }), [issues])

  const visibleIssues = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return issues
      .map((issue, index) => ({ issue, index }))
      .filter(({ issue }) => {
        const status = issue.status || 'OPEN'
        const matchesStatus = statusFilter === 'ALL' ||
          (statusFilter === 'ACTIVE' && ['OPEN', 'ACKNOWLEDGED'].includes(status)) ||
          (statusFilter === 'DECIDED' && ['RESOLVED', 'DISMISSED'].includes(status))
        const haystack = `${issue.title} ${issue.category} ${issue.explanation} ${issue.recommendation}`.toLowerCase()
        return matchesStatus && (!needle || haystack.includes(needle))
      })
      .sort((left, right) => {
        const statusDelta = Number(['RESOLVED', 'DISMISSED'].includes(left.issue.status)) -
          Number(['RESOLVED', 'DISMISSED'].includes(right.issue.status))
        if (statusDelta !== 0) return statusDelta
        const severityDelta = (severityRank[String(right.issue.severity).toLowerCase()] || 0) -
          (severityRank[String(left.issue.severity).toLowerCase()] || 0)
        if (severityDelta !== 0) return severityDelta
        return Number(right.issue.confidence || 0) - Number(left.issue.confidence || 0)
      })
  }, [issues, query, statusFilter])

  return (
    <aside className="issue-sidebar" aria-label="Prioritized finding review queue">
      <div className="issue-sidebar-header">
        <div className="issue-sidebar-title-row">
          <div>
            <h3>Review queue</h3>
            <p>{counts.active} active · {counts.high} high risk · {counts.decided} decided</p>
          </div>
          <button type="button" className="finding-export" onClick={onExport} disabled={issues.length === 0}>
            <Download size={13} /> CSV
          </button>
        </div>
        <label className="finding-search">
          <Search size={14} />
          <span className="sr-only">Search findings</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search findings…" />
        </label>
        <div className="finding-filter-group" aria-label="Filter findings by decision state">
          {[
            ['ACTIVE', `Active ${counts.active}`],
            ['DECIDED', `Decided ${counts.decided}`],
            ['ALL', `All ${issues.length}`],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={statusFilter === value ? 'active' : ''}
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="issue-list">
        {visibleIssues.length === 0 ? (
          <div className="issue-empty">No findings match this review queue.</div>
        ) : (
          visibleIssues.map(({ issue, index }) => {
            const id = getIssueStableId(issue, index)
            return (
              <IssueCard
                key={id}
                issue={issue}
                index={index}
                selected={selectedIssueId === id}
                onClick={onSelectIssue}
                onStatusChange={onStatusChange}
                onCopyLink={onCopyLink}
              />
            )
          })
        )}
      </div>
    </aside>
  )
}
