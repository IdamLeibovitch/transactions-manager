import {
  Alert,
  Box,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocalization } from '../../../app/LocalizationContext'
import type { CreateTransactionRequest, TransactionDto } from '../transactionTypes'
import { FocusedTransactionForm } from './FocusedTransactionForm'
import { FocusedTransactionsViewer } from './FocusedTransactionsViewer'

type FocusedTransactionDashboardProps = {
  accessToken: string | null
  approvedError: string | null
  approvedTransactions: TransactionDto[]
  isApprovedLoading: boolean
  isSubmitting: boolean
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
  onSubmitMessageClose: () => void
  submitMessage: string | null
}

const marketingImages = [
  'https://www.shva.co.il/wp-content/uploads/2023/03/canon-might-be-animated.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/ashrait.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/%D7%94%D7%95%D7%A8%D7%90%D7%AA.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/top.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/clp.png',
]

export function FocusedTransactionDashboard({
  accessToken,
  approvedError,
  approvedTransactions,
  isApprovedLoading,
  isSubmitting,
  onSubmit,
  onSubmitMessageClose,
  submitMessage,
}: FocusedTransactionDashboardProps) {
  return (
    <Stack spacing={{ xs: 4, md: 5 }} sx={{ flexGrow: 1, width: '100%' }} useFlexGap>
      <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <FocusedTransactionForm
            isSubmitting={isSubmitting}
            isDisabled={!accessToken}
            onSubmit={onSubmit}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <FocusedMarketingPanel />
        </Grid>
      </Grid>

      <Box sx={{ mt: 'auto' }}>
        <FocusedTransactionsViewer
          error={approvedError}
          isLoading={isApprovedLoading}
          transactions={approvedTransactions}
        />
      </Box>

      <Snackbar
        autoHideDuration={5000}
        onClose={onSubmitMessageClose}
        open={Boolean(submitMessage)}
      >
        <Alert onClose={onSubmitMessageClose} severity="info" variant="filled">
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
