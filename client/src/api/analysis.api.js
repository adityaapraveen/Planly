import { apiFetch } from '../services/api'

export async function triggerDrawingAnalysis(drawingId, reviewMode = 'SUBMISSION_READINESS') {
  return apiFetch(`/api/drawings/${drawingId}/analyze`, {
    method: 'POST',
    body: { reviewMode },
  })
}

export async function getDrawingAnalysis(drawingId, reviewMode = 'SUBMISSION_READINESS') {
  const params = new URLSearchParams({ reviewMode })
  return apiFetch(`/api/drawings/${drawingId}/analysis?${params.toString()}`)
}
