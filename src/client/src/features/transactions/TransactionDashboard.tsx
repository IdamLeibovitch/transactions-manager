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
import { useCallback, useEffect, useState } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import { interpolate } from '../../app/localization'
import { ApprovedTransactionCards } from './ApprovedTransactionCards'
import { FocusedTransactionForm } from './FocusedTransactionForm'
import { TransactionForm } from './TransactionForm'
import type {
  CreateTransactionRequest,
  TransactionDto,
  TransactionStatusChangedMessage,
} from './transactionTypes'
import type { TransactionViewMode } from './transactionViewTypes'
import { createTransaction, getTransaction, listTransactions } from './transactionsApi'
import { createTransactionsHubConnection } from './transactionsHub'

type RealtimeStatus = 'connected' | 'connecting' | 'disconnected'

type TransactionDashboardProps = {
  accessToken: string | null
  viewMode: TransactionViewMode
}

const marketingImages = [
  'https://www.shva.co.il/wp-content/uploads/2023/03/canon-might-be-animated.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/ashrait.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/%D7%94%D7%95%D7%A8%D7%90%D7%AA.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/top.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/clp.png',
]

export function TransactionDashboard({ accessToken, viewMode }: TransactionDashboardProps) {
  const { t } = useLocalization()
  const [approvedTransactions, setApprovedTransactions] = useState<TransactionDto[]>([])
  const [isLoadingApproved, setIsLoadingApproved] = useState(Boolean(accessToken))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approvedError, setApprovedError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>(
    accessToken ? 'connecting' : 'disconnected',
  )
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  const loadApprovedTransactions = useCallback(async () => {
    if (!accessToken) {
      setApprovedTransactions([])
      setIsLoadingApproved(false)
      setApprovedError(null)
      return
    }

    setApprovedError(null)
    setIsLoadingApproved(true)

    try {
      setApprovedTransactions(await listTransactions(accessToken, 'Approved'))
    } catch (error) {
      setApprovedError(readError(error, t))
    } finally {
      setIsLoadingApproved(false)
    }
  }, [accessToken, t])

  const handleStatusChanged = useCallback(async (message: TransactionStatusChangedMessage) => {
    if (!accessToken) {
      return
    }

    if (message.status === 'Approved') {
      try {
        const approvedTransaction = await getTransaction(message.transactionId, accessToken)
        setApprovedTransactions((current) => upsertApprovedTransaction(current, approvedTransaction))
        setSubmitMessage(t('message.transactionApproved'))
      } catch (error) {
        setApprovedError(readError(error, t))
      }

      return
    }

    if (message.status === 'Rejected') {
      setApprovedTransactions((current) =>
        current.filter((transaction) => transaction.id !== message.transactionId),
      )
      setSubmitMessage(
        interpolate(t('message.transactionRejected'), {
          reason: translateDecisionReason(message.decisionReason, t),
        }),
      )
    }
  }, [accessToken, t])

  useEffect(() => {
    let ignore = false

    async function loadInitialApprovedTransactions() {
      if (!accessToken) {
        setApprovedTransactions([])
        setIsLoadingApproved(false)
        setApprovedError(null)
        return
      }

      try {
        const transactions = await listTransactions(accessToken, 'Approved')

        if (!ignore) {
          setApprovedTransactions(transactions)
        }
      } catch (error) {
        if (!ignore) {
          setApprovedError(readError(error, t))
        }
      } finally {
        if (!ignore) {
          setIsLoadingApproved(false)
        }
      }
    }

    void loadInitialApprovedTransactions()

    return () => {
      ignore = true
    }
  }, [accessToken, t])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    let disposed = false

    const connection = createTransactionsHubConnection({
      accessToken,
      onClose: () => {
        if (!disposed) {
          setRealtimeStatus('disconnected')
        }
      },
      onReconnected: () => {
        if (!disposed) {
          setRealtimeStatus('connected')
        }
      },
      onReconnecting: () => {
        if (!disposed) {
          setRealtimeStatus('connecting')
        }
      },
      onStatusChanged: (message) => {
        void handleStatusChanged(message)
      },
    })

    async function startConnection() {
      while (!disposed) {
        try {
          setRealtimeStatus('connecting')
          await connection.start()

          if (!disposed) {
            setRealtimeStatus('connected')
          }

          return
        } catch {
          if (!disposed) {
            setRealtimeStatus('disconnected')
          }

          await delay(2000)
        }
      }
    }

    void startConnection()

    return () => {
      disposed = true
      void connection.stop()
    }
  }, [accessToken, handleStatusChanged])

  async function handleSubmit(request: CreateTransactionRequest) {
    if (!accessToken) {
      setSubmitMessage(t('message.loginBeforeSubmit'))
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      const response = await createTransaction(request, accessToken)
      setSubmitMessage(interpolate(t('message.transactionSubmitted'), { id: shortId(response.transactionId) }))
    } catch (error) {
      setSubmitMessage(readError(error, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  return viewMode === 'focused' ? (
    <Stack spacing={{ xs: 4, md: 5 }}>
      <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <FocusedTransactionForm
            isSubmitting={isSubmitting}
            isDisabled={!accessToken}
            onSubmit={handleSubmit}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <FocusedMarketingPanel />
        </Grid>
      </Grid>

      <ApprovedTransactionCards
        error={approvedError}
        isLoading={isLoadingApproved}
        onRefresh={loadApprovedTransactions}
        realtimeStatus={realtimeStatus}
        transactions={approvedTransactions}
      />

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
    <Stack spacing={3}>
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
            isSubmitting={isSubmitting}
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

      <ApprovedTransactionCards
        error={approvedError}
        isLoading={isLoadingApproved}
        onRefresh={loadApprovedTransactions}
        realtimeStatus={realtimeStatus}
        transactions={approvedTransactions}
      />

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
      <Grid container spacing={3} sx={{ alignItems: 'center', height: '100%' }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2}>
            <Typography color="primary" sx={{ fontWeight: 700 }}>
              {t('marketing.eyebrow')}
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: 'text.primary',
                fontSize: { xs: 32, md: 44 },
                fontWeight: 800,
                lineHeight: 1.12,
              }}
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
    </Paper>
  )
}

function upsertApprovedTransaction(current: TransactionDto[], transaction: TransactionDto) {
  if (transaction.status !== 'Approved') {
    return current.filter((item) => item.id !== transaction.id)
  }

  const withoutUpdated = current.filter((item) => item.id !== transaction.id)

  return [transaction, ...withoutUpdated].sort((left, right) =>
    right.createdAtUtc.localeCompare(left.createdAtUtc),
  )
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function readError(error: unknown, t: ReturnType<typeof useLocalization>['t']) {
  return error instanceof Error ? error.message : t('common.unexpectedError')
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
