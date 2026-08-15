import { apiFetch } from './api'

export async function getDrawings(projectId) {
  return apiFetch(`/api/projects/${projectId}/drawings`)
}

export async function uploadDrawing(projectId, file, { revisionOfId = null } = {}) {
  const formData = new FormData()
  formData.append('drawing', file)
  if (revisionOfId) formData.append('revisionOfId', revisionOfId)

  return apiFetch(`/api/projects/${projectId}/drawings`, {
    method: 'POST',
    body: formData,
  })
}

export async function getRevisionComparison(drawingId) {
  return apiFetch(`/api/drawings/${drawingId}/revision-comparison`)
}

export async function deleteDrawing(projectId, drawingId) {
  return apiFetch(`/api/projects/${projectId}/drawings/${drawingId}`, {
    method: 'DELETE',
  })
}
