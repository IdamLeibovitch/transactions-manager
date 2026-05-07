import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useLocalization } from '../../app/LocalizationContext'
import type { TransactionDto } from './transactionTypes'
import type { RegionCode } from './transactionTypes'

type ApprovedTransactionCardsProps = {
  error: string | null
  isLoading: boolean
  onRefresh: () => void
  realtimeStatus: 'connected' | 'connecting' | 'disconnected'
  transactions: TransactionDto[]
}

export function ApprovedTransactionCards({
  error,
  isLoading,
  onRefresh,
  realtimeStatus,
  transactions,
}: ApprovedTransactionCardsProps) {
  const { locale, t } = useLocalization()

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
      >
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h5">
          {t('cards.approvedTransactions')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            color={realtimeStatus === 'connected' ? 'success' : realtimeStatus === 'connecting' ? 'warning' : 'default'}
            label={t(`cards.realtime.${realtimeStatus}`)}
            variant={realtimeStatus === 'connected' ? 'filled' : 'outlined'}
          />
          <Chip
            color="success"
            icon={<CheckCircleIcon />}
            label={t('cards.approvedCount').replace('{count}', String(transactions.length))}
          />
          <Button onClick={onRefresh} startIcon={<RefreshIcon />} variant="outlined">
            {t('cards.refresh')}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress aria-label={t('cards.loading')} />
        </Stack>
      ) : transactions.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 700 }}>{t('cards.emptyTitle')}</Typography>
            <Typography color="text.secondary">
              {t('cards.emptyBody')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {transactions.map((transaction) => (
            <Grid key={transaction.id} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 700 }}>{transaction.merchantName}</Typography>
                      <Chip color="success" label={t('common.approved')} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {shortId(transaction.id)}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Typography>
                        {transaction.currency} {formatAmount(transaction.amount, locale)}
                      </Typography>
                      <Typography color="text.secondary">
                        {t(getRegionKey(transaction.region))} · {formatLocalTime(transaction.localSubmittedAt, locale, t)}
                      </Typography>
                    </Stack>
                    {transaction.decisionReason && (
                      <Typography color="text.secondary" variant="body2">
                        {translateDecisionReason(transaction.decisionReason, t)}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

function shortId(id: string) {
  return `TX-${id.slice(0, 8).toUpperCase()}`
}

function formatAmount(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatLocalTime(
  localSubmittedAt: string | null,
  locale: string,
  t: ReturnType<typeof useLocalization>['t'],
) {
  if (!localSubmittedAt) {
    return t('cards.pendingTime')
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(localSubmittedAt))
}

function getRegionKey(region: RegionCode) {
  return `region.${region}` as const
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
      return reason
  }
}
