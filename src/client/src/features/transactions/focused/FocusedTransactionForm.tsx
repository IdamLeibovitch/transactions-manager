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
import { useId, useRef, type KeyboardEvent, type Ref } from 'react'
import { useLocalization } from '../../../app/LocalizationContext'
import type { CreateTransactionRequest } from '../transactionTypes'
import { StaticTransactionTimePicker } from './StaticTransactionTimePicker'
import { useFocusedTransactionForm } from './useFocusedTransactionForm'

type FocusedTransactionFormProps = {
  isDisabled?: boolean
  isSubmitting: boolean
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
}

export function FocusedTransactionForm({
  isDisabled = false,
  isSubmitting,
  onSubmit,
}: FocusedTransactionFormProps) {
  const { direction, t } = useLocalization()
  const {
    errors,
    handlePickerChange,
    handleSubmit,
    handleTimePartBlur,
    handleTimePartBoundary,
    handleTimePartChange,
    handleTimePartStep,
    handleTimeZoneChange,
    isSubmitted,
    selectedTimeZone,
    setTimeEntryMode,
    submittedTime,
    timeEntryMode,
    timePickerValue,
    timeZoneOptions,
  } = useFocusedTransactionForm({ onSubmit })
  const hourInputRef = useRef<HTMLInputElement | null>(null)
  const minuteInputRef = useRef<HTMLInputElement | null>(null)
  const timeGroupLabelId = useId()
  const timeHelperId = useId()
  const timeKeyboardHelpId = useId()
  const timeDescriptionIds = `${timeHelperId} ${timeKeyboardHelpId}`

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
              spacing={timeEntryMode === 'text' ? 2.5 : 1}
              sx={{
                bgcolor: '#d7cdea',
                borderRadius: 6,
                p: timeEntryMode === 'text' ? { xs: 2.5, sm: 3 } : { xs: 1.5, sm: 2 },
              }}
            >
              {timeEntryMode === 'text' ? (
                <Stack spacing={2.5}>
                  <Typography
                    color="text.primary"
                    id={timeGroupLabelId}
                    sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}
                  >
                    {t('form.enterTime')}
                  </Typography>
                  <Stack
                    aria-describedby={timeDescriptionIds}
                    aria-labelledby={timeGroupLabelId}
                    direction="row"
                    role="group"
                    spacing={{ xs: 1.5, sm: 2 }}
                    useFlexGap
                    sx={{ alignItems: 'flex-start', direction: 'ltr /* @noflip */' }}
                  >
                    <TimePartInput
                      ariaLabel={t('form.hour')}
                      describedBy={timeDescriptionIds}
                      disabled={isDisabled || isSubmitting}
                      error={isSubmitted && Boolean(errors.hour)}
                      inputRef={hourInputRef}
                      label={t('form.hour')}
                      max={23}
                      onChange={(value) =>
                        handleTimePartChange('hour', value, () => minuteInputRef.current?.focus())
                      }
                      onMax={() => handleTimePartBoundary('hour', 'max')}
                      onMin={() => handleTimePartBoundary('hour', 'min')}
                      onMoveNext={() => minuteInputRef.current?.focus()}
                      onNormalize={() => handleTimePartBlur('hour')}
                      onStep={(step) => handleTimePartStep('hour', step)}
                      value={submittedTime.hour}
                    />
                    <Typography
                      aria-hidden="true"
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
                      error={isSubmitted && Boolean(errors.minute)}
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
                </Stack>
              ) : (
                <StaticTransactionTimePicker onChange={handlePickerChange} value={timePickerValue} />
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
                  id={timeHelperId}
                  sx={{ color: '#4f465f', direction, textAlign: 'end' }}
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
          color: '#4f465f',
          fontWeight: 600,
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: 'primary.main',
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
