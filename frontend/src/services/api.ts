const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem('compix_token')
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem('compix_token', token)
    else localStorage.removeItem('compix_token')
  } catch {
    // The app can still work without persistent storage.
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | undefined> {
  const token = getToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const body = await response.json() as { title?: string; detail?: string; message?: string }
      message = body.detail || body.title || body.message || message
    } catch {
      // Keep the HTTP status message when the response has no JSON body.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined
  return await response.json() as T
}
