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
import { useLocalization } from '../../../app/LocalizationContext'
import type { CreateTransactionRequest, TransactionDto } from '../transactionTypes'
import { ApprovedTransactionCards } from './ApprovedTransactionCards'
import { TransactionForm } from './TransactionForm'

type DetailedTransactionDashboardProps = {
  accessToken: string | null
  approvedError: string | null
  approvedTransactions: TransactionDto[]
  isApprovedLoading: boolean
  isRealtimeConnected: boolean
  isSubmitting: boolean
  onRefreshApprovedTransactions: () => void
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
  onSubmitMessageClose: () => void
  submitMessage: string | null
}

export function DetailedTransactionDashboard({
  accessToken,
  approvedError,
  approvedTransactions,
  isApprovedLoading,
  isRealtimeConnected,
  isSubmitting,
  onRefreshApprovedTransactions,
  onSubmit,
  onSubmitMessageClose,
  submitMessage,
}: DetailedTransactionDashboardProps) {
  const { t } = useLocalization()

  return (
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
            isSubmitting={isSubmitting}
            isDisabled={!accessToken}
            onSubmit={onSubmit}
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
          error={approvedError}
          isLoading={isApprovedLoading}
          onRefresh={onRefreshApprovedTransactions}
          showRefresh={!isRealtimeConnected}
          transactions={approvedTransactions}
        />
      </Box>

      <Snackbar
        autoHideDuration={5000}
        onClose={onSubmitMessageClose}
        open={Boolean(submitMessage)}
      >
        <Alert
          aria-live="polite"
          onClose={onSubmitMessageClose}
          role="status"
          severity="info"
          variant="filled"
        >
          {submitMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
