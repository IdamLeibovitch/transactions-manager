import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  TransactionDto,
  TransactionStatus,
} from './transactionTypes'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080'

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export async function createTransaction(request: CreateTransactionRequest, accessToken: string) {
  return sendJson<CreateTransactionResponse>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(request),
  }, accessToken)
}

export async function getTransaction(id: string, accessToken: string) {
  return sendJson<TransactionDto>(`/api/transactions/${id}`, undefined, accessToken)
}

export async function listTransactions(accessToken: string, status?: TransactionStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''

  return sendJson<TransactionDto[]>(`/api/transactions${query}`, undefined, accessToken)
}

async function sendJson<T>(path: string, init?: RequestInit, accessToken?: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new UnauthorizedError()
    }

    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as T
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with ${response.status}`

  try {
    const body = await response.json()

    if (typeof body?.title === 'string') {
      return body.title
    }

    if (typeof body?.detail === 'string') {
      return body.detail
    }

    if (body?.errors && typeof body.errors === 'object') {
      return Object.values(body.errors).flat().join(' ')
    }
  } catch {
    return fallback
  }

  return fallback
}
