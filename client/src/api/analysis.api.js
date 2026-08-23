import { apiFetch } from '../services/api'

export async function triggerDrawingAnalysis(
  drawingId,
  reviewMode = 'SUBMISSION_READINESS',
  force = false,
) {
  return apiFetch(`/api/drawings/${drawingId}/analyze`, {
    method: 'POST',
    body: { reviewMode, force },
  })
}

export async function getDrawingAnalysis(drawingId, reviewMode = 'SUBMISSION_READINESS') {
  const params = new URLSearchParams({ reviewMode })
  return apiFetch(`/api/drawings/${drawingId}/analysis?${params.toString()}`)
}

export async function updateAnalysisIssue(issueId, review) {
  return apiFetch(`/api/analysis/issues/${issueId}`, {
    method: 'PATCH',
    body: review,
  })
}
