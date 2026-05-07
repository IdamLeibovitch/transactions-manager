import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SendIcon from '@mui/icons-material/Send'
import {
  Autocomplete,
  Box,
  Button,
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
import { useId, useMemo, useRef, useState, type KeyboardEvent, type Ref } from 'react'
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
  const { direction, t } = useLocalization()
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
  const [timeEntryMode, setTimeEntryMode] = useState<'text' | 'picker'>('text')
  const [submitted, setSubmitted] = useState(false)
  const hourInputRef = useRef<HTMLInputElement | null>(null)
  const minuteInputRef = useRef<HTMLInputElement | null>(null)
  const timeGroupLabelId = useId()
  const timeHelperId = useId()
  const timeKeyboardHelpId = useId()
  const timeDescriptionIds = `${timeHelperId} ${timeKeyboardHelpId}`

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

    if (part === 'hour' && digitsOnly.length === 2) {
      window.setTimeout(() => minuteInputRef.current?.focus(), 0)
    }
  }

  function handleTimePartStep(part: keyof TimeParts, step: number) {
    const currentValue = Number(submittedTime[part])
    const current = Number.isFinite(currentValue) ? currentValue : 0
    const max = part === 'hour' ? 23 : 59
    const next = wrapNumber(current + step, 0, max)

    setSubmittedTime((value) => ({
      ...value,
      [part]: String(next).padStart(2, '0'),
    }))
  }

  function handleTimePartBoundary(part: keyof TimeParts, boundary: 'min' | 'max') {
    setSubmittedTime((value) => ({
      ...value,
      [part]: boundary === 'min' ? '00' : part === 'hour' ? '23' : '59',
    }))
  }

  function handleTimePartBlur(part: keyof TimeParts) {
    const value = submittedTime[part]

    if (part === 'hour' && isValidHour(value)) {
      setSubmittedTime((current) => ({ ...current, hour: value.padStart(2, '0') }))
    }

    if (part === 'minute' && isValidMinute(value)) {
      setSubmittedTime((current) => ({ ...current, minute: value.padStart(2, '0') }))
    }
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
              <Typography color="text.secondary" id={timeGroupLabelId} sx={{ fontWeight: 700 }}>
                {t('form.enterTime')}
              </Typography>

              {timeEntryMode === 'text' ? (
                <Stack
                  aria-describedby={timeDescriptionIds}
                  aria-labelledby={timeGroupLabelId}
                  direction="row"
                  role="group"
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <TimePartInput
                    ariaLabel={t('form.hour')}
                    describedBy={timeDescriptionIds}
                    disabled={isDisabled || isSubmitting}
                    error={submitted && !isValidHour(submittedTime.hour)}
                    inputRef={hourInputRef}
                    label={t('form.hour')}
                    max={23}
                    onChange={(value) => handleTimePartChange('hour', value)}
                    onMax={() => handleTimePartBoundary('hour', 'max')}
                    onMin={() => handleTimePartBoundary('hour', 'min')}
                    onMoveNext={() => minuteInputRef.current?.focus()}
                    onNormalize={() => handleTimePartBlur('hour')}
                    onStep={(step) => handleTimePartStep('hour', step)}
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
                    ariaLabel={t('form.minute')}
                    describedBy={timeDescriptionIds}
                    disabled={isDisabled || isSubmitting}
                    error={submitted && !isValidMinute(submittedTime.minute)}
                    inputRef={minuteInputRef}
                    label={t('form.minute')}
                    max={59}
                    onChange={(value) => handleTimePartChange('minute', value)}
                    onMax={() => handleTimePartBoundary('minute', 'max')}
                    onMin={() => handleTimePartBoundary('minute', 'min')}
                    onMovePrevious={() => hourInputRef.current?.focus()}
                    onNormalize={() => handleTimePartBlur('minute')}
                    onStep={(step) => handleTimePartStep('minute', step)}
                    value={submittedTime.minute}
                  />
                </Stack>
              ) : (
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
              )}

              <Stack
                direction="row"
                sx={{ alignItems: 'center', direction: 'ltr', justifyContent: 'space-between' }}
              >
                <Tooltip title={timeEntryMode === 'text' ? t('form.timePicker') : t('form.textTimeInput')}>
                  <IconButton
                    aria-label={timeEntryMode === 'text' ? t('form.timePicker') : t('form.textTimeInput')}
                    disabled={isDisabled || isSubmitting}
                    onClick={() => setTimeEntryMode((current) => (current === 'text' ? 'picker' : 'text'))}
                  >
                    <AccessTimeIcon />
                  </IconButton>
                </Tooltip>
                <Typography
                  color="text.secondary"
                  id={timeHelperId}
                  sx={{ direction, textAlign: 'end' }}
                  variant="body2"
                >
                  {t('form.localTimeHelper')}
                </Typography>
                <Typography
                  id={timeKeyboardHelpId}
                  sx={{
                    border: 0,
                    clip: 'rect(0 0 0 0)',
                    height: 1,
                    m: -1,
                    overflow: 'hidden',
                    p: 0,
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    width: 1,
                  }}
                >
                  {t('form.timeKeyboardHelp')}
                </Typography>
              </Stack>

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
  ariaLabel: string
  describedBy: string
  disabled: boolean
  error: boolean
  inputRef: Ref<HTMLInputElement>
  label: string
  max: 23 | 59
  onChange: (value: string) => void
  onMax: () => void
  onMin: () => void
  onMoveNext?: () => void
  onMovePrevious?: () => void
  onNormalize: () => void
  onStep: (step: number) => void
  value: string
}

function TimePartInput({
  ariaLabel,
  describedBy,
  disabled,
  error,
  inputRef,
  label,
  max,
  onChange,
  onMax,
  onMin,
  onMoveNext,
  onMovePrevious,
  onNormalize,
  onStep,
  value,
}: TimePartInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        onStep(1)
        return
      case 'ArrowDown':
        event.preventDefault()
        onStep(-1)
        return
      case 'Home':
        event.preventDefault()
        onMin()
        return
      case 'End':
        event.preventDefault()
        onMax()
        return
      case ':':
      case 'ArrowRight':
        if (onMoveNext) {
          event.preventDefault()
          onMoveNext()
        }
        return
      case 'ArrowLeft':
        if (onMovePrevious && event.currentTarget.selectionStart === 0) {
          event.preventDefault()
          onMovePrevious()
        }
        return
      case 'Backspace':
        if (onMovePrevious && value.length === 0) {
          event.preventDefault()
          onMovePrevious()
        }
        return
      default:
    }
  }

  return (
    <TextField
      disabled={disabled}
      error={error}
      fullWidth
      inputRef={inputRef}
      label={label}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onNormalize}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={handleKeyDown}
      slotProps={{
        htmlInput: {
          'aria-describedby': describedBy,
          'aria-invalid': error || undefined,
          'aria-label': ariaLabel,
          inputMode: 'numeric',
          maxLength: 2,
          max,
          min: 0,
          pattern: '[0-9]*',
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

function wrapNumber(value: number, min: number, max: number) {
  if (value > max) {
    return min
  }

  if (value < min) {
    return max
  }

  return value
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
