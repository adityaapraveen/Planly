import { apiFetch } from '../services/api'

export async function getDrawingReport(drawingId) {
  return apiFetch(`/api/drawings/${drawingId}/report`)
}

export async function updateSheetMetadata(sheetId, changes) {
  return apiFetch(`/api/sheets/${sheetId}`, {
    method: 'PATCH',
    body: changes,
  })
}
