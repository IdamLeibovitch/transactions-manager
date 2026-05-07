import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocalization } from '../../app/LocalizationContext'
import { interpolate } from '../../app/localization'
import type { AppDispatch } from '../../app/store'
import { isUnauthorizedApiError, readApiErrorMessage } from '../../shared/api/apiErrors'
import {
  api,
  useCreateTransactionMutation,
  useLazyGetTransactionQuery,
  useListTransactionsQuery,
} from '../../shared/api/apiSlice'
import { useSignalR } from '../../shared/hooks/useSignalR'
import { DetailedTransactionDashboard } from './detailed/DetailedTransactionDashboard'
import { FocusedTransactionDashboard } from './focused/FocusedTransactionDashboard'
import type {
  CreateTransactionRequest,
  TransactionDto,
  TransactionStatusChangedMessage,
} from './transactionTypes'
import type { TransactionViewMode } from './transactionViewTypes'

type TransactionDashboardProps = {
  accessToken: string | null
  onUnauthorized: () => void
  viewMode: TransactionViewMode
}

const transactionsHubUrl = import.meta.env.VITE_SIGNALR_URL ?? 'http://localhost:5081/ws/transactions'

export function TransactionDashboard({ accessToken, onUnauthorized, viewMode }: TransactionDashboardProps) {
  const { t } = useLocalization()
  const dispatch = useDispatch<AppDispatch>()
  const [approvedError, setApprovedError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [createTransaction, createTransactionResult] = useCreateTransactionMutation()
  const [getTransaction] = useLazyGetTransactionQuery()
  const {
    data: approvedTransactions = [],
    error: approvedQueryError,
    isFetching: isFetchingApproved,
    isLoading: isLoadingApproved,
    refetch: refetchApprovedTransactions,
  } = useListTransactionsQuery('Approved', {
    skip: !accessToken,
  })
  const approvedQueryErrorMessage = approvedQueryError
    ? readApiErrorMessage(approvedQueryError, t('common.unexpectedError'))
    : null
  const approvedCardsError = approvedError ?? approvedQueryErrorMessage
  const isApprovedLoading = Boolean(accessToken) && (isLoadingApproved || isFetchingApproved)

  const loadApprovedTransactions = useCallback(async () => {
    if (!accessToken) {
      setApprovedError(null)
      return
    }

    setApprovedError(null)

    try {
      await refetchApprovedTransactions().unwrap()
    } catch (error) {
      handleApiError(error, onUnauthorized, (message) => setApprovedError(message), t)
    }
  }, [accessToken, onUnauthorized, refetchApprovedTransactions, t])

  const handleStatusChanged = useCallback(async (message: TransactionStatusChangedMessage) => {
    if (!accessToken) {
      return
    }

    if (message.status === 'Approved') {
      try {
        const approvedTransaction = await getTransaction(message.transactionId).unwrap()
        dispatch(api.util.updateQueryData('listTransactions', 'Approved', (draft) => {
          upsertApprovedTransaction(draft, approvedTransaction)
        }))
        setSubmitMessage(t('message.transactionApproved'))
      } catch (error) {
        handleApiError(error, onUnauthorized, (message) => setApprovedError(message), t)
      }

      return
    }

    if (message.status === 'Rejected') {
      dispatch(api.util.updateQueryData('listTransactions', 'Approved', (draft) => {
        removeApprovedTransaction(draft, message.transactionId)
      }))
      setSubmitMessage(
        interpolate(t('message.transactionRejected'), {
          reason: translateDecisionReason(message.decisionReason, t),
        }),
      )
    }
  }, [accessToken, dispatch, getTransaction, onUnauthorized, t])

  const signalREventHandlers = useMemo(() => [
    {
      eventName: 'transactionStatusChanged',
      handler: (message: TransactionStatusChangedMessage) => {
        void handleStatusChanged(message)
      },
    },
  ], [handleStatusChanged])

  const { isConnected: isRealtimeConnected } = useSignalR({
    accessToken,
    eventHandlers: signalREventHandlers,
    onUnauthorized,
    url: transactionsHubUrl,
  })

  useEffect(() => {
    if (approvedQueryError && isUnauthorizedApiError(approvedQueryError)) {
      onUnauthorized()
    }
  }, [approvedQueryError, onUnauthorized])

  async function handleSubmit(request: CreateTransactionRequest) {
    if (!accessToken) {
      setSubmitMessage(t('message.loginBeforeSubmit'))
      return
    }

    setSubmitMessage(null)

    try {
      const response = await createTransaction(request).unwrap()
      setSubmitMessage(interpolate(t('message.transactionSubmitted'), { id: shortId(response.transactionId) }))
    } catch (error) {
      handleApiError(error, onUnauthorized, (message) => setSubmitMessage(message), t)
    }
  }

  return viewMode === 'focused' ? (
    <FocusedTransactionDashboard
      accessToken={accessToken}
      approvedError={approvedCardsError}
      approvedTransactions={approvedTransactions}
      isApprovedLoading={isApprovedLoading}
      isSubmitting={createTransactionResult.isLoading}
      onSubmit={handleSubmit}
      onSubmitMessageClose={() => setSubmitMessage(null)}
      submitMessage={submitMessage}
    />
  ) : (
    <DetailedTransactionDashboard
      accessToken={accessToken}
      approvedError={approvedCardsError}
      approvedTransactions={approvedTransactions}
      isApprovedLoading={isApprovedLoading}
      isRealtimeConnected={isRealtimeConnected}
      isSubmitting={createTransactionResult.isLoading}
      onRefreshApprovedTransactions={loadApprovedTransactions}
      onSubmit={handleSubmit}
      onSubmitMessageClose={() => setSubmitMessage(null)}
      submitMessage={submitMessage}
    />
  )
}

function upsertApprovedTransaction(transactions: TransactionDto[], transaction: TransactionDto) {
  removeApprovedTransaction(transactions, transaction.id)

  if (transaction.status !== 'Approved') {
    return
  }

  transactions.unshift(transaction)
  transactions.sort((left, right) =>
    right.createdAtUtc.localeCompare(left.createdAtUtc),
  )
}

function removeApprovedTransaction(transactions: TransactionDto[], transactionId: string) {
  const existingIndex = transactions.findIndex((transaction) => transaction.id === transactionId)

  if (existingIndex >= 0) {
    transactions.splice(existingIndex, 1)
  }
}

function handleApiError(
  error: unknown,
  onUnauthorized: () => void,
  onOtherError: (message: string) => void,
  t: ReturnType<typeof useLocalization>['t'],
) {
  if (isUnauthorizedApiError(error)) {
    onUnauthorized()
    return
  }

  onOtherError(readApiErrorMessage(error, t('common.unexpectedError')))
}

function shortId(id: string) {
  return `TX-${id.slice(0, 8).toUpperCase()}`
}

function translateDecisionReason(
  reason: string | null,
  t: ReturnType<typeof useLocalization>['t'],
) {
  switch (reason) {
    case 'Within banking hours':
      return t('decision.withinBankingHours')
    case 'Outside banking hours':
      return t('decision.outsideBankingHours')
    case 'Unsupported region':
      return t('decision.unsupportedRegion')
    default:
      return reason ?? t('common.unexpectedError')
  }
}
