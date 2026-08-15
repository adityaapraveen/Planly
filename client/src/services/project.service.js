import { apiFetch } from './api'

export async function getProjects() {
  return apiFetch('/api/projects')
}

export async function getProject(projectId) {
  return apiFetch(`/api/projects/${projectId}`)
}

export async function createProject({ name, description }) {
  return apiFetch('/api/projects', {
    method: 'POST',
    body: { name, description },
  })
}

export async function updateProject(projectId, { name, description }) {
  return apiFetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: { name, description },
  })
}

export async function deleteProject(projectId) {
  return apiFetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function searchProjectEvidence(projectId, query) {
  const params = new URLSearchParams({ q: query })
  return apiFetch(`/api/projects/${projectId}/search?${params.toString()}`)
}

export async function askProjectQuestion(projectId, question) {
  return apiFetch(`/api/projects/${projectId}/questions`, {
    method: 'POST',
    body: { question },
  })
}

export async function getProjectQuestions(projectId) {
  return apiFetch(`/api/projects/${projectId}/questions`)
}

export async function getProjectChecks(projectId) {
  return apiFetch(`/api/projects/${projectId}/checks`)
}

export async function updateProjectCheck(projectId, checkKey, changes) {
  return apiFetch(`/api/projects/${projectId}/checks/${checkKey}`, {
    method: 'PATCH',
    body: changes,
  })
}
