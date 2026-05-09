import { apiFetch } from './api'

export async function analyzeDrawing(drawingId) {
  return apiFetch(`/api/drawings/${drawingId}/analyze`, {
    method: 'POST',
  })
}

export async function getDrawingAnalysis(drawingId) {
  return apiFetch(`/api/drawings/${drawingId}/analysis`)
}
