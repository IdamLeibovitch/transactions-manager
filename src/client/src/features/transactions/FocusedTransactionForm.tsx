import SendIcon from '@mui/icons-material/Send'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { CreateTransactionRequest, RegionCode } from './transactionTypes'
import { regions } from './transactionTypes'

type FocusedTransactionFormProps = {
  isDisabled?: boolean
  isSubmitting: boolean
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
}

type TimeZoneOption = {
  code: RegionCode
  label: string
  timeZone: string
}

export function FocusedTransactionForm({
  isDisabled = false,
  isSubmitting,
  onSubmit,
}: FocusedTransactionFormProps) {
  const { t } = useLocalization()
  const timeZoneOptions = useMemo(
    () =>
      regions.map((region) => ({
        code: region.code,
        label: t(region.translationKey),
        timeZone: region.timeZone,
      })),
    [t],
  )
  const [selectedRegionCode, setSelectedRegionCode] = useState<RegionCode>('IL')
  const selectedTimeZone = timeZoneOptions.find((option) => option.code === selectedRegionCode) ?? timeZoneOptions[0]
  const [submittedTime, setSubmittedTime] = useState(formatTimeInputValue(new Date(), timeZoneOptions[0].timeZone))
  const [submitted, setSubmitted] = useState(false)

  const isTimeInvalid = !isValidTime(submittedTime)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    if (isTimeInvalid) {
      return
    }

    await onSubmit({
      amount: 125.5,
      currency: 'ILS',
      merchantName: 'Terminal 42',
      region: selectedTimeZone.code,
      submittedAt: toUtcIsoStringForTimeZone(submittedTime, selectedTimeZone.timeZone),
    })
  }

  function handleTimeZoneChange(option: TimeZoneOption | null) {
    if (!option) {
      return
    }

    setSelectedRegionCode(option.code)
    setSubmittedTime(formatTimeInputValue(new Date(), option.timeZone))
  }

  return (
    <Paper
      component="form"
      elevation={0}
      onSubmit={handleSubmit}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        mx: 'auto',
        p: { xs: 2.5, sm: 4 },
        width: '100%',
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.75} sx={{ textAlign: 'center' }}>
          <Typography component="h1" sx={{ fontWeight: 700 }} variant="h4">
            {t('focused.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('focused.subtitle')}
          </Typography>
        </Stack>

        {submitted && isTimeInvalid && <Alert severity="error">{t('validation.submittedAt')}</Alert>}

        <Stack spacing={2.5}>
          <Autocomplete
            disableClearable
            disabled={isDisabled || isSubmitting}
            getOptionLabel={(option) => `${option.label} (${option.timeZone})`}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, option) => handleTimeZoneChange(option)}
            options={timeZoneOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('form.timeZone')}
                placeholder={t('form.timeZonePlaceholder')}
              />
            )}
            value={selectedTimeZone}
          />

          <Box>
            <Typography color="text.secondary" sx={{ mb: 1, fontWeight: 600 }} variant="body2">
              {t('form.localTime')}
            </Typography>
            <TextField
              disabled={isDisabled || isSubmitting}
              error={submitted && isTimeInvalid}
              fullWidth
              helperText={submitted && isTimeInvalid ? t('validation.submittedAt') : t('form.localTimeHelper')}
              onChange={(event) => setSubmittedTime(event.target.value)}
              slotProps={{
                htmlInput: {
                  step: 60,
                },
              }}
              sx={{
                '& input': {
                  fontSize: { xs: 36, sm: 48 },
                  fontWeight: 700,
                  height: 'auto',
                  letterSpacing: 0,
                  py: 2,
                  textAlign: 'center',
                },
              }}
              type="time"
              value={submittedTime}
            />
          </Box>

          <Button
            disabled={isDisabled}
            loading={isSubmitting}
            size="large"
            startIcon={<SendIcon />}
            type="submit"
            variant="contained"
          >
            {t('form.submit')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value)
}

function formatTimeInputValue(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone,
  }).formatToParts(date)

  const hour = readPart(parts, 'hour') === '24' ? '00' : readPart(parts, 'hour')

  return `${hour}:${readPart(parts, 'minute')}`
}

function toUtcIsoStringForTimeZone(time: string, timeZone: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const { day, month, year } = getDatePartsInTimeZone(new Date(), timeZone)
  const tentativeUtc = Date.UTC(year, month - 1, day, hours, minutes, 0)
  const offset = getOffsetMinutes(timeZone, new Date(tentativeUtc))
  const adjustedUtc = tentativeUtc - offset * 60_000
  const verifiedOffset = getOffsetMinutes(timeZone, new Date(adjustedUtc))

  return new Date(tentativeUtc - verifiedOffset * 60_000).toISOString()
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)

  return {
    day: Number(readPart(parts, 'day')),
    month: Number(readPart(parts, 'month')),
    year: Number(readPart(parts, 'year')),
  }
}

function getOffsetMinutes(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const asUtc = Date.UTC(
    Number(readPart(parts, 'year')),
    Number(readPart(parts, 'month')) - 1,
    Number(readPart(parts, 'day')),
    Number(readPart(parts, 'hour')),
    Number(readPart(parts, 'minute')),
    Number(readPart(parts, 'second')),
  )

  return (asUtc - date.getTime()) / 60_000
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? '00'
}
