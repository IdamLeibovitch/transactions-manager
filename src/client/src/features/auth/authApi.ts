import type { LoginRequest, LoginResponse } from './authTypes'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080'

export async function login(request: LoginRequest) {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Invalid username or password.' : 'Login failed.')
  }

  return (await response.json()) as LoginResponse
}
