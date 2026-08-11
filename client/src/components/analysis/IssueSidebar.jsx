import { IssueCard } from './IssueCard'
import { getIssueStableId } from './issue-id'

export function IssueSidebar({ issues, selectedIssueId, onSelectIssue, onStatusChange }) {
  const high = issues.filter((i) => String(i.severity || '').toLowerCase() === 'high').length
  const medium = issues.filter((i) => String(i.severity || '').toLowerCase() === 'medium').length
  const low = issues.filter((i) => String(i.severity || '').toLowerCase() === 'low').length

  return (
    <aside className="issue-sidebar">
      <div className="issue-sidebar-header">
        <h3>Findings</h3>
        <p>{issues.length} total · H {high} · M {medium} · L {low}</p>
      </div>
      <div className="issue-list">
        {issues.length === 0 ? (
          <div className="issue-empty">No issues were returned for this drawing.</div>
        ) : (
          issues.map((issue, index) => {
            const id = getIssueStableId(issue, index)
            return (
              <IssueCard
                key={id}
                issue={issue}
                index={index}
                selected={selectedIssueId === id}
                onClick={onSelectIssue}
                onStatusChange={onStatusChange}
              />
            )
          })
        )}
      </div>
    </aside>
  )
}
