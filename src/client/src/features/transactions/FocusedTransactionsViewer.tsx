import { keyframes } from '@emotion/react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useRef } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import { TransactionNavigationButton } from './TransactionNavigationButton'
import type { RegionCode, TransactionDto } from './transactionTypes'
import { regions } from './transactionTypes'
import { scrollTransactionList, type TransactionNavigationAction } from './utils/transactionListNavigation'

type FocusedTransactionsViewerProps = {
  error: string | null
  isLoading: boolean
  transactions: TransactionDto[]
}

const focusedTransactionEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export function FocusedTransactionsViewer({
  error,
  isLoading,
  transactions,
}: FocusedTransactionsViewerProps) {
  const { direction, locale, t } = useLocalization()
  const theme = useTheme()
  const showSideButtons = useMediaQuery(theme.breakpoints.up('lg'))
  const listRef = useRef<HTMLDivElement | null>(null)
  const approvedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'Approved'),
    [transactions],
  )

  function scrollTransactions(action: TransactionNavigationAction) {
    const list = listRef.current

    if (!list) {
      return
    }

    scrollTransactionList(list, '[data-focused-transaction-card]', action)
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h5">
          {t('cards.approvedTransactions')}
        </Typography>

        {!showSideButtons && approvedTransactions.length > 0 && (
          <Stack direction="row" spacing={0.5}>
            <TransactionNavigationButton
              action="previous"
              disabled={approvedTransactions.length === 0}
              onClick={() => scrollTransactions('previous')}
              title={t('cards.previous')}
            />
            <TransactionNavigationButton
              action="next"
              disabled={approvedTransactions.length === 0}
              onClick={() => scrollTransactions('next')}
              title={t('cards.next')}
            />
          </Stack>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Stack sx={{ alignItems: 'center', py: 5 }}>
          <CircularProgress aria-label={t('cards.loading')} />
        </Stack>
      ) : approvedTransactions.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 700 }}>{t('cards.emptyTitle')}</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          <Box sx={{ position: 'relative', px: { lg: 5 } }}>
            {showSideButtons && (
              <TransactionNavigationButton
                action="previous"
                disabled={approvedTransactions.length === 0}
                onClick={() => scrollTransactions('previous')}
                placement="side"
                title={t('cards.previous')}
              />
            )}

            <Box
              dir={direction}
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
              {approvedTransactions.map((transaction) => (
                <Card
                  data-focused-transaction-card
                  dir={direction}
                  key={transaction.id}
                  variant="outlined"
                  sx={{
                    animation: `${focusedTransactionEnter} ${theme.transitions.duration.standard}ms ease 90ms both`,
                    flex: '0 0 auto',
                    minHeight: 118,
                    scrollSnapAlign: 'start',
                    width: { xs: '78vw', sm: 260, md: 280 },
                  }}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 700 }} variant="h6">
                      {t('cards.timeTitle').replace(
                        '{time}',
                        formatLocalTime(transaction.localSubmittedAt, locale, t),
                      )}
                    </Typography>
                    <Typography color="text.secondary">
                      {t('cards.timeZoneSubtitle').replace('{timeZone}', getRegionTimeZone(transaction.region))}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {showSideButtons && (
              <TransactionNavigationButton
                action="next"
                disabled={approvedTransactions.length === 0}
                onClick={() => scrollTransactions('next')}
                placement="side"
                title={t('cards.next')}
              />
            )}
          </Box>
        </Stack>
      )}
    </Box>
  )
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
