const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let accessToken = null
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

/**
 * Try to refresh the access token using the httpOnly refresh cookie.
 * Returns the new access token or null on failure.
 */
async function refreshToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      const json = await res.json()
      if (json.success && json.data?.accessToken) {
        setAccessToken(json.data.accessToken)
        return json.data.accessToken
      }
      return null
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Core fetch wrapper. Handles:
 * - Bearer token injection
 * - Credentials (cookies) inclusion
 * - Automatic 401 → refresh → retry (once)
 * - JSON parsing and error normalization
 */
export async function apiFetch(endpoint, options = {}) {
  const { headers: customHeaders, body, ...rest } = options

  const headers = { ...customHeaders }

  // Don't set Content-Type for FormData — browser handles multipart boundary
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const config = {
    ...rest,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  }

  let res = await fetch(`${API_URL}${endpoint}`, config)

  // If 401, try refreshing once (works even after page reload when token is only in cookie)
  if (res.status === 401) {
    const newToken = await refreshToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      config.headers = headers
      res = await fetch(`${API_URL}${endpoint}`, config)
    } else {
      clearAccessToken()
    }
  }

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message = json?.message || `Request failed (${res.status})`
    const error = new Error(message)
    error.status = res.status
    error.data = json
    throw error
  }

  return json
}
