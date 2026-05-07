import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SendIcon from '@mui/icons-material/Send'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider as DatePickerLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker'
import dayjs, { type Dayjs } from 'dayjs'
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
  const [submittedTime, setSubmittedTime] = useState<TimeParts>(() =>
    toTimeParts(formatTimeInputValue(new Date(), timeZoneOptions[0].timeZone)),
  )
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isTimeInvalid = !isValidTime(submittedTime)
  const timePickerValue = toDayjsTime(submittedTime)

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
      submittedAt: toUtcIsoStringForTimeZone(toTimeString(submittedTime), selectedTimeZone.timeZone),
    })
  }

  function handleTimeZoneChange(option: TimeZoneOption | null) {
    if (!option) {
      return
    }

    setSelectedRegionCode(option.code)
    setSubmittedTime(toTimeParts(formatTimeInputValue(new Date(), option.timeZone)))
  }

  function handleTimePartChange(part: keyof TimeParts, value: string) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 2)

    setSubmittedTime((current) => ({
      ...current,
      [part]: digitsOnly,
    }))
  }

  function handlePickerChange(value: Dayjs | null) {
    if (!value) {
      return
    }

    setSubmittedTime({
      hour: String(value.hour()).padStart(2, '0'),
      minute: String(value.minute()).padStart(2, '0'),
    })
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
            <Stack
              spacing={2.5}
              sx={{
                bgcolor: '#d7cdea',
                borderRadius: 6,
                p: { xs: 2.5, sm: 3 },
              }}
            >
              <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                {t('form.enterTime')}
              </Typography>

              <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} sx={{ alignItems: 'flex-start' }}>
                <TimePartInput
                  disabled={isDisabled || isSubmitting}
                  error={submitted && !isValidHour(submittedTime.hour)}
                  label={t('form.hour')}
                  onChange={(value) => handleTimePartChange('hour', value)}
                  value={submittedTime.hour}
                />
                <Typography
                  sx={{
                    color: 'text.primary',
                    fontSize: { xs: 48, sm: 64 },
                    fontWeight: 700,
                    lineHeight: 1.05,
                    pt: 1.5,
                  }}
                >
                  :
                </Typography>
                <TimePartInput
                  disabled={isDisabled || isSubmitting}
                  error={submitted && !isValidMinute(submittedTime.minute)}
                  label={t('form.minute')}
                  onChange={(value) => handleTimePartChange('minute', value)}
                  value={submittedTime.minute}
                />
              </Stack>

              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Tooltip title={t('form.timePicker')}>
                  <IconButton
                    aria-label={t('form.timePicker')}
                    disabled={isDisabled || isSubmitting}
                    onClick={() => setIsPickerOpen((current) => !current)}
                  >
                    <AccessTimeIcon />
                  </IconButton>
                </Tooltip>
                <Typography color={submitted && isTimeInvalid ? 'error' : 'text.secondary'} variant="body2">
                  {submitted && isTimeInvalid ? t('validation.submittedAt') : t('form.localTimeHelper')}
                </Typography>
              </Stack>

              <Collapse in={isPickerOpen} unmountOnExit>
                <Box
                  sx={{
                    '& .MuiPickersLayout-root': {
                      bgcolor: 'transparent',
                    },
                    '& .MuiTimeClock-root': {
                      mx: 'auto',
                    },
                  }}
                >
                  <DatePickerLocalizationProvider dateAdapter={AdapterDayjs}>
                    <StaticTimePicker
                      ampm={false}
                      onChange={handlePickerChange}
                      orientation="portrait"
                      slotProps={{
                        actionBar: {
                          actions: [],
                        },
                      }}
                      value={timePickerValue}
                    />
                  </DatePickerLocalizationProvider>
                </Box>
              </Collapse>
            </Stack>
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

type TimeParts = {
  hour: string
  minute: string
}

type TimePartInputProps = {
  disabled: boolean
  error: boolean
  label: string
  onChange: (value: string) => void
  value: string
}

function TimePartInput({ disabled, error, label, onChange, value }: TimePartInputProps) {
  return (
    <TextField
      disabled={disabled}
      error={error}
      fullWidth
      label={label}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        htmlInput: {
          inputMode: 'numeric',
          maxLength: 2,
        },
      }}
      sx={{
        '& .MuiInputBase-input': {
          fontSize: { xs: 48, sm: 64 },
          fontWeight: 700,
          height: 'auto',
          letterSpacing: 0,
          lineHeight: 1.05,
          py: 1.5,
          textAlign: 'center',
        },
        '& .MuiInputLabel-root': {
          fontWeight: 600,
        },
        '& .MuiOutlinedInput-root': {
          bgcolor: error ? '#fff5f5' : '#f0e8ff',
          borderRadius: 2,
        },
      }}
      value={value}
    />
  )
}

function isValidTime(value: TimeParts) {
  return isValidHour(value.hour) && isValidMinute(value.minute)
}

function isValidHour(value: string) {
  return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 23
}

function isValidMinute(value: string) {
  return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 59
}

function toTimeParts(value: string): TimeParts {
  const [hour, minute] = value.split(':')

  return { hour, minute }
}

function toTimeString(value: TimeParts) {
  return `${value.hour.padStart(2, '0')}:${value.minute.padStart(2, '0')}`
}

function toDayjsTime(value: TimeParts) {
  if (!isValidTime(value)) {
    return dayjs().hour(0).minute(0).second(0)
  }

  return dayjs().hour(Number(value.hour)).minute(Number(value.minute)).second(0)
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
