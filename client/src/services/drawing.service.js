import { apiFetch } from './api'

export async function getDrawings(projectId) {
  return apiFetch(`/api/projects/${projectId}/drawings`)
}

export async function uploadDrawing(projectId, file) {
  const formData = new FormData()
  formData.append('drawing', file)

  return apiFetch(`/api/projects/${projectId}/drawings`, {
    method: 'POST',
    body: formData,
  })
}
