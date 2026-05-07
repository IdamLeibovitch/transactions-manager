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
import type { TransactionDto } from './transactionTypes'
import { getRegionLabel } from './transactionTypes'

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
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
      >
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h5">
          Approved transactions
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip color="success" icon={<CheckCircleIcon />} label={`${transactions.length} approved`} />
          <Button onClick={onRefresh} startIcon={<RefreshIcon />} variant="outlined">
            Refresh
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
          <CircularProgress aria-label="Loading approved transactions" />
        </Stack>
      ) : transactions.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 700 }}>No approved transactions yet</Typography>
            <Typography color="text.secondary">
              Approved submissions will appear here after the processor finishes.
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
                      <Chip color="success" label="Approved" size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {shortId(transaction.id)}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Typography>
                        {transaction.currency} {formatAmount(transaction.amount)}
                      </Typography>
                      <Typography color="text.secondary">
                        {getRegionLabel(transaction.region)} · {formatLocalTime(transaction.localSubmittedAt)}
                      </Typography>
                    </Stack>
                    {transaction.decisionReason && (
                      <Typography color="text.secondary" variant="body2">
                        {transaction.decisionReason}
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatLocalTime(localSubmittedAt: string | null) {
  if (!localSubmittedAt) {
    return 'Pending time'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(localSubmittedAt))
}
