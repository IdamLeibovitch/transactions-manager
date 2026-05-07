import SendIcon from '@mui/icons-material/Send'
import {
  Alert,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { Controller } from 'react-hook-form'
import { useLocalization } from '../../../app/LocalizationContext'
import type { CreateTransactionRequest } from '../transactionTypes'
import { regions } from '../transactionTypes'
import { useTransactionForm } from './useTransactionForm'

type TransactionFormProps = {
  isDisabled?: boolean
  isSubmitting: boolean
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
}

export function TransactionForm({ isDisabled = false, isSubmitting, onSubmit }: TransactionFormProps) {
  const { t } = useLocalization()
  const { control, errors, handleSubmit, isSubmitted, showErrors } = useTransactionForm({ onSubmit })

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Grid container spacing={2}>
        {showErrors && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error">{t('form.fixErrors')}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isDisabled || isSubmitting}
                error={isSubmitted && Boolean(errors.amount)}
                fullWidth
                helperText={isSubmitted ? errors.amount?.message : ' '}
                inputMode="decimal"
                label={t('form.amount')}
                placeholder="125.50"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isDisabled || isSubmitting}
                error={isSubmitted && Boolean(errors.currency)}
                fullWidth
                helperText={isSubmitted ? errors.currency?.message : ' '}
                label={t('form.currency')}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                placeholder="ILS"
                slotProps={{ htmlInput: { maxLength: 3 } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            control={control}
            name="merchantName"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isDisabled || isSubmitting}
                error={isSubmitted && Boolean(errors.merchantName)}
                fullWidth
                helperText={isSubmitted ? errors.merchantName?.message : ' '}
                label={t('form.merchantName')}
                placeholder="Terminal 42"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth error={isSubmitted && Boolean(errors.region)}>
            <InputLabel id="region-label">{t('form.region')}</InputLabel>
            <Controller
              control={control}
              name="region"
              render={({ field }) => (
                <Select
                  {...field}
                  disabled={isDisabled || isSubmitting}
                  label={t('form.region')}
                  labelId="region-label"
                >
                  {regions.map((region) => (
                    <MenuItem key={region.code} value={region.code}>
                      {t(region.translationKey)}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            control={control}
            name="submittedAtUtc"
            render={({ field }) => (
              <TextField
                {...field}
                disabled={isDisabled || isSubmitting}
                error={isSubmitted && Boolean(errors.submittedAtUtc)}
                fullWidth
                helperText={isSubmitted ? errors.submittedAtUtc?.message : t('form.utcHelper')}
                label={t('form.submittedInstant')}
                slotProps={{ htmlInput: { step: 60 } }}
                type="datetime-local"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button
              disabled={isDisabled}
              loading={isSubmitting}
              startIcon={<SendIcon />}
              type="submit"
              variant="contained"
            >
              {t('form.submit')}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  )
}
