import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getStoredAccessToken } from '../../features/auth/authSession'
import type { LoginRequest, LoginResponse } from '../../features/auth/authTypes'
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  TransactionDto,
  TransactionStatus,
} from '../../features/transactions/transactionTypes'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json')

      const accessToken = getStoredAccessToken()

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }

      return headers
    },
  }),
  tagTypes: ['Transactions'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
    }),
    createTransaction: builder.mutation<CreateTransactionResponse, CreateTransactionRequest>({
      query: (body) => ({
        url: '/api/transactions',
        method: 'POST',
        body,
      }),
    }),
    getTransaction: builder.query<TransactionDto, string>({
      query: (id) => `/api/transactions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Transactions', id }],
    }),
    listTransactions: builder.query<TransactionDto[], TransactionStatus | undefined>({
      query: (status) => ({
        url: '/api/transactions',
        params: status ? { status } : undefined,
      }),
      providesTags: (_result, _error, status) => [{ type: 'Transactions', id: status ?? 'all' }],
    }),
  }),
})

export const {
  useCreateTransactionMutation,
  useGetTransactionQuery,
  useLazyGetTransactionQuery,
  useListTransactionsQuery,
  useLoginMutation,
} = api
