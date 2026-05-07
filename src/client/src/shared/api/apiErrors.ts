import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

export function isUnauthorizedApiError(error: unknown) {
  return isFetchBaseQueryError(error)
    ? error.status === 401
    : error instanceof Error && /(?:401|Unauthorized)/i.test(error.message)
}

export function readApiErrorMessage(error: unknown, fallback: string) {
  if (isFetchBaseQueryError(error)) {
    return readFetchBaseQueryErrorMessage(error, fallback)
  }

  if (isSerializedError(error) && error.message) {
    return error.message
  }

  return error instanceof Error ? error.message : fallback
}

function readFetchBaseQueryErrorMessage(error: FetchBaseQueryError, fallback: string) {
  const data = error.data

  if (typeof data === 'string') {
    return data
  }

  if (isProblemDetails(data)) {
    if (typeof data.title === 'string') {
      return data.title
    }

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (data.errors && typeof data.errors === 'object') {
      return Object.values(data.errors).flat().join(' ')
    }
  }

  return typeof error.status === 'number' ? `Request failed with ${error.status}` : fallback
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return Boolean(error && typeof error === 'object' && 'status' in error)
}

function isSerializedError(error: unknown): error is SerializedError {
  return Boolean(error && typeof error === 'object' && 'message' in error)
}

function isProblemDetails(value: unknown): value is {
  detail?: unknown
  errors?: Record<string, unknown[]>
  title?: unknown
} {
  return Boolean(value && typeof value === 'object')
}
