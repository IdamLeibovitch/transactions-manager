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
import { ApprovedTransactionCards } from './ApprovedTransactionCards'
import { TransactionForm } from './TransactionForm'
import type { CreateTransactionRequest, TransactionDto } from './transactionTypes'
import { createTransaction, getTransaction, listTransactions } from './transactionsApi'

const processedStatusCheckLimit = 16

export function TransactionDashboard() {
  const [approvedTransactions, setApprovedTransactions] = useState<TransactionDto[]>([])
  const [isLoadingApproved, setIsLoadingApproved] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approvedError, setApprovedError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  const loadApprovedTransactions = useCallback(async () => {
    setApprovedError(null)
    setIsLoadingApproved(true)

    try {
      setApprovedTransactions(await listTransactions('Approved'))
    } catch (error) {
      setApprovedError(readError(error))
    } finally {
      setIsLoadingApproved(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadInitialApprovedTransactions() {
      try {
        const transactions = await listTransactions('Approved')

        if (!ignore) {
          setApprovedTransactions(transactions)
        }
      } catch (error) {
        if (!ignore) {
          setApprovedError(readError(error))
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
  }, [])

  async function handleSubmit(request: CreateTransactionRequest) {
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      const response = await createTransaction(request)
      const processedTransaction = await waitForProcessedTransaction(response.transactionId)

      if (processedTransaction?.status === 'Approved') {
        setSubmitMessage('Transaction approved.')
      } else if (processedTransaction?.status === 'Rejected') {
        setSubmitMessage(`Transaction rejected: ${processedTransaction.decisionReason ?? 'approval rules failed'}.`)
      } else {
        setSubmitMessage('Transaction submitted and is still pending.')
      }

      await loadApprovedTransactions()
    } catch (error) {
      setSubmitMessage(readError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h4">
          Submit transaction
        </Typography>
        <Typography color="text.secondary">
          Submitted instants are evaluated against local banking hours in the selected region.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <TransactionForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <ScheduleIcon color="secondary" />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Banking hours</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Approved from 08:00 through 17:59 local time.
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <PublicIcon color="primary" />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Selected region decides the local time</Typography>
                  <Typography color="text.secondary" variant="body2">
                    The backend stores every submission and only approved transactions appear below.
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

async function waitForProcessedTransaction(transactionId: string) {
  for (let attempt = 0; attempt < processedStatusCheckLimit; attempt += 1) {
    const transaction = await getTransaction(transactionId)

    if (transaction.status !== 'Pending') {
      return transaction
    }

    await delay(750)
  }

  return null
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error'
}
