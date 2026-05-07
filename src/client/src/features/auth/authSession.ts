import type { AuthSession } from './authTypes'

export const authStorageKey = 'transactions-manager.auth'

const expirationSkewMs = 30_000

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const session = value as Partial<AuthSession>

  return (
    typeof session.accessToken === 'string' &&
    typeof session.expiresAtUtc === 'string' &&
    typeof session.username === 'string'
  )
}

export function isSessionExpired(session: AuthSession, now = Date.now()) {
  return getSessionExpirationTime(session) <= now + expirationSkewMs
}

export function getMillisecondsUntilSessionExpiration(session: AuthSession, now = Date.now()) {
  return Math.max(0, getSessionExpirationTime(session) - now - expirationSkewMs)
}

export function getStoredAccessToken() {
  const storedValue = window.localStorage.getItem(authStorageKey)

  if (!storedValue) {
    return null
  }

  try {
    const session = JSON.parse(storedValue) as unknown

    return isAuthSession(session) && !isSessionExpired(session) ? session.accessToken : null
  } catch {
    return null
  }
}

function getSessionExpirationTime(session: AuthSession) {
  const expiresAt = Date.parse(session.expiresAtUtc)

  return Number.isFinite(expiresAt) ? expiresAt : 0
}
