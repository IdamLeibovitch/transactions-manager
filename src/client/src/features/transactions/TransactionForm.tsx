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
import { useMemo, useState } from 'react'
import type { CreateTransactionRequest, RegionCode } from './transactionTypes'
import { regions } from './transactionTypes'

type TransactionFormProps = {
  isDisabled?: boolean
  isSubmitting: boolean
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
}

type FormState = {
  amount: string
  currency: string
  merchantName: string
  region: RegionCode
  submittedAtUtc: string
}

const initialState: FormState = {
  amount: '125.50',
  currency: 'ILS',
  merchantName: 'Terminal 42',
  region: 'IL',
  submittedAtUtc: formatUtcInputValue(new Date()),
}

export function TransactionForm({ isDisabled = false, isSubmitting, onSubmit }: TransactionFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState)
  const [submitted, setSubmitted] = useState(false)

  const validation = useMemo(() => validateForm(formState), [formState])
  const showErrors = submitted && Object.keys(validation).length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    if (Object.keys(validation).length > 0) {
      return
    }

    await onSubmit({
      amount: Number(formState.amount),
      currency: formState.currency.trim().toUpperCase(),
      merchantName: formState.merchantName.trim(),
      region: formState.region,
      submittedAt: toUtcIsoString(formState.submittedAtUtc),
    })
  }

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Grid container spacing={2}>
        {showErrors && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error">Fix the highlighted fields before submitting.</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            disabled={isDisabled || isSubmitting}
            error={submitted && Boolean(validation.amount)}
            fullWidth
            helperText={submitted ? validation.amount : ' '}
            inputMode="decimal"
            label="Amount"
            onChange={(event) => updateField('amount', event.target.value)}
            placeholder="125.50"
            value={formState.amount}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            disabled={isDisabled || isSubmitting}
            error={submitted && Boolean(validation.currency)}
            fullWidth
            helperText={submitted ? validation.currency : ' '}
            label="Currency"
            onChange={(event) => updateField('currency', event.target.value.toUpperCase())}
            placeholder="ILS"
            slotProps={{ htmlInput: { maxLength: 3 } }}
            value={formState.currency}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            disabled={isDisabled || isSubmitting}
            error={submitted && Boolean(validation.merchantName)}
            fullWidth
            helperText={submitted ? validation.merchantName : ' '}
            label="Merchant name"
            onChange={(event) => updateField('merchantName', event.target.value)}
            placeholder="Terminal 42"
            value={formState.merchantName}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              disabled={isDisabled || isSubmitting}
              label="Region"
              labelId="region-label"
              onChange={(event) => updateField('region', event.target.value as RegionCode)}
              value={formState.region}
            >
              {regions.map((region) => (
                <MenuItem key={region.code} value={region.code}>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            disabled={isDisabled || isSubmitting}
            error={submitted && Boolean(validation.submittedAtUtc)}
            fullWidth
            helperText={submitted ? validation.submittedAtUtc : 'UTC instant used for approval'}
            label="Submitted instant"
            onChange={(event) => updateField('submittedAtUtc', event.target.value)}
            slotProps={{ htmlInput: { step: 60 } }}
            type="datetime-local"
            value={formState.submittedAtUtc}
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
              Submit transaction
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  )

  function updateField<TField extends keyof FormState>(field: TField, value: FormState[TField]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }
}

function validateForm(formState: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const amount = Number(formState.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than zero.'
  }

  if (formState.currency.trim().length !== 3) {
    errors.currency = 'Use a three-letter currency code.'
  }

  const merchantName = formState.merchantName.trim()
  if (merchantName.length === 0 || merchantName.length > 120) {
    errors.merchantName = 'Merchant name is required and cannot exceed 120 characters.'
  }

  if (Number.isNaN(new Date(toUtcIsoString(formState.submittedAtUtc)).getTime())) {
    errors.submittedAtUtc = 'Choose a valid submitted instant.'
  }

  return errors
}

function toUtcIsoString(value: string) {
  return `${value}:00Z`
}

function formatUtcInputValue(date: Date) {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  const hours = `${date.getUTCHours()}`.padStart(2, '0')
  const minutes = `${date.getUTCMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
