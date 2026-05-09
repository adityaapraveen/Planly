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
