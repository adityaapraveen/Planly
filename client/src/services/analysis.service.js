import { apiFetch } from './api'

export async function analyzeDrawing(drawingId, reviewMode = 'SUBMISSION_READINESS', force = false) {
  return apiFetch(`/api/drawings/${drawingId}/analyze`, {
    method: 'POST',
    body: { reviewMode, force },
  })
}

export async function getDrawingAnalysis(drawingId, reviewMode = 'SUBMISSION_READINESS') {
  const params = new URLSearchParams({ reviewMode })
  return apiFetch(`/api/drawings/${drawingId}/analysis?${params.toString()}`)
}
