import PublicIcon from '@mui/icons-material/Public'
import ScheduleIcon from '@mui/icons-material/Schedule'
import {
  Alert,
  Box,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
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
import { ApprovedTransactionCards } from './ApprovedTransactionCards'
import { FocusedTransactionForm } from './FocusedTransactionForm'
import { FocusedTransactionsViewer } from './FocusedTransactionsViewer'
import { TransactionForm } from './TransactionForm'
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

const marketingImages = [
  'https://www.shva.co.il/wp-content/uploads/2023/03/canon-might-be-animated.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/ashrait.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/%D7%94%D7%95%D7%A8%D7%90%D7%AA.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/top.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/clp.png',
]

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
    <Stack spacing={{ xs: 4, md: 5 }} sx={{ flexGrow: 1, width: '100%' }} useFlexGap>
      <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <FocusedTransactionForm
            isSubmitting={createTransactionResult.isLoading}
            isDisabled={!accessToken}
            onSubmit={handleSubmit}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <FocusedMarketingPanel />
        </Grid>
      </Grid>

      <Box sx={{ mt: 'auto' }}>
        <FocusedTransactionsViewer
          error={approvedCardsError}
          isLoading={isApprovedLoading}
          transactions={approvedTransactions}
        />
      </Box>

      <Snackbar
        autoHideDuration={5000}
        onClose={() => setSubmitMessage(null)}
        open={Boolean(submitMessage)}
      >
        <Alert onClose={() => setSubmitMessage(null)} severity="info" variant="filled">
          {submitMessage}
        </Alert>
      </Snackbar>
    </Stack>
  ) : (
    <Stack spacing={3} sx={{ flexGrow: 1, width: '100%' }} useFlexGap>
      <Stack spacing={1}>
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h4">
          {t('dashboard.title')}
        </Typography>
        <Typography color="text.secondary">
          {t('dashboard.subtitle')}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          {!accessToken && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('dashboard.authRequired')}
            </Alert>
          )}
          <TransactionForm
            isSubmitting={createTransactionResult.isLoading}
            isDisabled={!accessToken}
            onSubmit={handleSubmit}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <ScheduleIcon color="secondary" />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{t('dashboard.bankingHours.title')}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {t('dashboard.bankingHours.body')}
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <PublicIcon color="primary" />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{t('dashboard.localTime.title')}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {t('dashboard.localTime.body')}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 'auto' }}>
        <ApprovedTransactionCards
          error={approvedCardsError}
          isLoading={isApprovedLoading}
          onRefresh={loadApprovedTransactions}
          showRefresh={!isRealtimeConnected}
          transactions={approvedTransactions}
        />
      </Box>

      <Snackbar
        autoHideDuration={5000}
        onClose={() => setSubmitMessage(null)}
        open={Boolean(submitMessage)}
      >
        <Alert onClose={() => setSubmitMessage(null)} severity="info" variant="filled">
          {submitMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

function FocusedMarketingPanel() {
  const { t } = useLocalization()
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % marketingImages.length)
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        minHeight: { md: 360 },
        p: { xs: 1, md: 2 },
      }}
    >
      <Stack spacing={3} sx={{ height: '100%' }}>
        <Stack spacing={1.25} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            sx={{
              bgcolor: '#ffffff',
              border: 1,
              borderColor: '#d8d8d8',
              borderRadius: 1.5,
              boxShadow: '0 2px 0 rgba(0, 0, 0, 0.22)',
              px: { xs: 2, sm: 3 },
              py: 0.5,
            }}
          >
            <Typography
              sx={{
                color: '#3d3d3f',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 800,
                lineHeight: 1.2,
                textTransform: 'uppercase',
              }}
              variant="h2"
            >
              {t('simulator.title')}
            </Typography>
          </Box>
          <Typography
            sx={{
              color: '#3a3a3d',
              fontSize: { xs: '1rem', sm: '1.15rem' },
              fontWeight: 800,
              lineHeight: 1.3,
            }}
            variant="h2"
          >
            {t('simulator.question')}
          </Typography>
        </Stack>
        <Grid container spacing={3} sx={{ alignItems: 'center', flexGrow: 1 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={2}>
              <Typography
                component="h1"
                sx={{
                  color: 'primary.main',
                  fontSize: { xs: 28, md: 38 },
                  fontWeight: 800,
                  lineHeight: 1.12,
                }}
                variant="h1"
              >
                {t('marketing.title')}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 16, md: 18 }, lineHeight: 1.8 }}>
                {t('marketing.subtitle')}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ lg: 5 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Box
              sx={{
                height: 280,
                position: 'relative',
                width: '100%',
              }}
            >
              {marketingImages.map((image, index) => (
                <Box
                  alt=""
                  component="img"
                  key={image}
                  src={image}
                  sx={{
                    display: 'block',
                    inset: 0,
                    maxHeight: 280,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    opacity: index === imageIndex ? 1 : 0,
                    position: 'absolute',
                    transition: 'opacity 650ms ease-in-out',
                    width: '100%',
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
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
