import { apiFetch } from '../services/api'

export async function getDrawingReport(drawingId) {
  return apiFetch(`/api/drawings/${drawingId}/report`)
}
