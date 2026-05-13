export function getIssueStableId(issue, index) {
  return issue.id || `${issue.page || 1}-${index}`
}
