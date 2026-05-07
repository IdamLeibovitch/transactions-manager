import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { keyframes } from '@emotion/react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useRef, type ReactNode } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { RegionCode, TransactionDto } from './transactionTypes'
import { regions } from './transactionTypes'

type FocusedTransactionsViewerProps = {
  error: string | null
  isLoading: boolean
  transactions: TransactionDto[]
}

const fullVisibilityTolerance = 2
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
  const showSideButtons = useMediaQuery(theme.breakpoints.up('md'))
  const listRef = useRef<HTMLDivElement | null>(null)
  const approvedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'Approved'),
    [transactions],
  )

  function scrollTransactions(visualDirection: 'left' | 'right') {
    const list = listRef.current

    if (!list) {
      return
    }

    const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-focused-transaction-card]'))

    if (cards.length === 0) {
      return
    }

    const listRect = list.getBoundingClientRect()
    const cardRects = cards.map((card) => card.getBoundingClientRect())
    const fullyVisibleIndexes = cardRects
      .map((rect, index) => ({ index, rect }))
      .filter(({ rect }) =>
        rect.left >= listRect.left - fullVisibilityTolerance &&
        rect.right <= listRect.right + fullVisibilityTolerance,
      )
      .map(({ index }) => index)
    const visibleCount = Math.max(1, fullyVisibleIndexes.length)
    const firstFullyVisibleIndex = fullyVisibleIndexes[0] ?? 0
    const lastFullyVisibleIndex = fullyVisibleIndexes.at(-1) ?? 0

    const targetIndex = visualDirection === 'right'
      ? findNextCardIndex(cardRects, listRect, lastFullyVisibleIndex)
      : findPreviousCardIndex(cardRects, listRect, firstFullyVisibleIndex, visibleCount)

    scrollCardIntoView(list, cards[targetIndex])
  }

  return (
    <Box>
      <Typography component="h2" sx={{ fontWeight: 700, mb: 2 }} variant="h5">
        {t('cards.approvedTransactions')}
      </Typography>

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
        <Box sx={{ position: 'relative' }}>
          {showSideButtons && (
            <SideScrollButton
              ariaLabel={t('cards.previous')}
              disabled={approvedTransactions.length === 0}
              edge="left"
              onClick={() => scrollTransactions('left')}
              title={t('cards.previous')}
            >
              <ChevronLeftIcon />
            </SideScrollButton>
          )}

          <Box
            ref={listRef}
            sx={{
              direction: 'ltr',
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
                key={transaction.id}
                variant="outlined"
                sx={{
                  direction,
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
            <SideScrollButton
              ariaLabel={t('cards.next')}
              disabled={approvedTransactions.length === 0}
              edge="right"
              onClick={() => scrollTransactions('right')}
              title={t('cards.next')}
            >
              <ChevronRightIcon />
            </SideScrollButton>
          )}
        </Box>
      )}
    </Box>
  )
}

function SideScrollButton({
  ariaLabel,
  children,
  disabled,
  edge,
  onClick,
  title,
}: {
  ariaLabel: string
  children: ReactNode
  disabled: boolean
  edge: 'left' | 'right'
  onClick: () => void
  title: string
}) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onClick}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            boxShadow: 2,
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            ...(edge === 'left' ? { left: -22 } : { right: -22 }),
            '&:hover': {
              bgcolor: 'background.paper',
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  )
}

function findNextCardIndex(
  cardRects: DOMRect[],
  listRect: DOMRect,
  lastFullyVisibleIndex: number,
) {
  const partialAfterIndex = cardRects.findIndex((rect) =>
    rect.left < listRect.right - fullVisibilityTolerance &&
    rect.right > listRect.right + fullVisibilityTolerance,
  )

  if (partialAfterIndex >= 0) {
    return partialAfterIndex
  }

  return Math.min(cardRects.length - 1, lastFullyVisibleIndex + 1)
}

function findPreviousCardIndex(
  cardRects: DOMRect[],
  listRect: DOMRect,
  firstFullyVisibleIndex: number,
  visibleCount: number,
) {
  const partialBeforeIndex = cardRects.findLastIndex((rect) =>
    rect.left < listRect.left - fullVisibilityTolerance &&
    rect.right > listRect.left + fullVisibilityTolerance,
  )

  if (partialBeforeIndex >= 0) {
    return partialBeforeIndex
  }

  return Math.max(0, firstFullyVisibleIndex - visibleCount)
}

function scrollCardIntoView(list: HTMLDivElement, card: HTMLElement) {
  const listRect = list.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()

  list.scrollTo({
    behavior: 'smooth',
    left: list.scrollLeft + cardRect.left - listRect.left,
  })
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
