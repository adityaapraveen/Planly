import { apiFetch } from './api'

export async function loginUser({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function registerUser({ name, email, password }) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })
}

export async function refreshAccessToken() {
  return apiFetch('/api/auth/refresh', {
    method: 'POST',
  })
}

export async function logoutUser() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  })
}

export async function getMe() {
  return apiFetch('/api/auth/me')
}
