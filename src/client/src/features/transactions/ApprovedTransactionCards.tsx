import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useRef } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { TransactionDto } from './transactionTypes'
import type { RegionCode } from './transactionTypes'
import { regions } from './transactionTypes'

type ApprovedTransactionCardsProps = {
  error: string | null
  isLoading: boolean
  onRefresh: () => void
  transactions: TransactionDto[]
}

export function ApprovedTransactionCards({
  error,
  isLoading,
  onRefresh,
  transactions,
}: ApprovedTransactionCardsProps) {
  const { direction, locale, t } = useLocalization()
  const listRef = useRef<HTMLDivElement | null>(null)

  function scrollTransactions(visualDirection: 'left' | 'right') {
    const directionMultiplier = direction === 'rtl' ? -1 : 1
    const left = (visualDirection === 'left' ? -320 : 320) * directionMultiplier

    listRef.current?.scrollBy({ behavior: 'smooth', left })
  }

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
            color="success"
            icon={<CheckCircleIcon />}
            label={t('cards.approvedCount').replace('{count}', String(transactions.length))}
          />
          <Button onClick={onRefresh} startIcon={<RefreshIcon />} variant="outlined">
            {t('cards.refresh')}
          </Button>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={t('cards.previous')}>
              <span>
                <IconButton
                  aria-label={t('cards.previous')}
                  disabled={isLoading || transactions.length === 0}
                  onClick={() => scrollTransactions('left')}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('cards.next')}>
              <span>
                <IconButton
                  aria-label={t('cards.next')}
                  disabled={isLoading || transactions.length === 0}
                  onClick={() => scrollTransactions('right')}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
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
        <Box
          ref={listRef}
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin',
          }}
        >
          {transactions.map((transaction) => (
            <Card
              key={transaction.id}
              variant="outlined"
              sx={{
                flex: '0 0 auto',
                minHeight: 164,
                scrollSnapAlign: 'start',
                width: { xs: '82vw', sm: 300, md: 320 },
              }}
            >
              <CardContent sx={{ height: '100%' }}>
                <Stack spacing={1.5} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                    <Chip color="success" label={t('common.approved')} size="small" />
                    <Typography color="text.secondary" variant="body2">
                      {shortId(transaction.id)}
                    </Typography>
                  </Stack>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700 }} variant="h6">
                      {t('cards.timeTitle').replace(
                        '{time}',
                        formatLocalTime(transaction.localSubmittedAt, locale, t),
                      )}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('cards.timeZoneSubtitle').replace('{timeZone}', getRegionTimeZone(transaction.region))}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                    <Typography color="text.secondary" variant="body2">
                      {transaction.merchantName}
                    </Typography>
                    <Typography variant="body2">
                      {transaction.currency} {formatAmount(transaction.amount, locale)}
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
          ))}
        </Box>
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

function getRegionTimeZone(region: RegionCode) {
  return regions.find((item) => item.code === region)?.timeZone ?? region
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
