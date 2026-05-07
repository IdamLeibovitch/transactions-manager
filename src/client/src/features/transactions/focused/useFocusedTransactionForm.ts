import type { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form'
import { useLocalization } from '../../../app/LocalizationContext'
import type { CreateTransactionRequest, RegionCode } from '../transactionTypes'
import { regions } from '../transactionTypes'
import {
  formatTimeInputValue,
  isValidHour,
  isValidMinute,
  toDayjsTime,
  toTimeParts,
  toTimeString,
  toUtcIsoStringForTimeZone,
  wrapNumber,
  type TimeParts,
} from '../utils/timeUtils'

export type FocusedTransactionFormValues = {
  hour: string
  minute: string
  region: RegionCode
}

type TimeZoneOption = {
  code: RegionCode
  label: string
  timeZone: string
}

type UseFocusedTransactionFormOptions = {
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
}

export function useFocusedTransactionForm({ onSubmit }: UseFocusedTransactionFormOptions) {
  const { t } = useLocalization()
  const [timeEntryMode, setTimeEntryMode] = useState<'text' | 'picker'>('text')
  const timeZoneOptions = useMemo(
    () =>
      regions.map((region) => ({
        code: region.code,
        label: t(region.translationKey),
        timeZone: region.timeZone,
      })),
    [t],
  )
  const resolver = useMemo<Resolver<FocusedTransactionFormValues>>(() => async (values) => {
    const errors: FieldErrors<FocusedTransactionFormValues> = {}

    if (!regions.some((region) => region.code === values.region)) {
      errors.region = { message: t('validation.region'), type: 'validate' }
    }

    if (!isValidHour(values.hour)) {
      errors.hour = { message: t('validation.submittedAt'), type: 'validate' }
    }

    if (!isValidMinute(values.minute)) {
      errors.minute = { message: t('validation.submittedAt'), type: 'validate' }
    }

    return {
      errors,
      values: Object.keys(errors).length === 0 ? values : {},
    }
  }, [t])
  const form = useForm<FocusedTransactionFormValues>({
    defaultValues: createDefaultValues(timeZoneOptions[0].timeZone),
    resolver,
  })
  const { errors, isSubmitted } = form.formState
  const formValues = useWatch({ control: form.control })
  const selectedTimeZone =
    timeZoneOptions.find((option) => option.code === formValues.region) ?? timeZoneOptions[0]
  const submittedTime: TimeParts = {
    hour: formValues.hour ?? '',
    minute: formValues.minute ?? '',
  }

  function setTimePart(part: keyof TimeParts, value: string, shouldValidate = isSubmitted) {
    form.setValue(part, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate,
    })
  }

  function setTimeParts(value: TimeParts, shouldValidate = isSubmitted) {
    setTimePart('hour', value.hour, shouldValidate)
    setTimePart('minute', value.minute, shouldValidate)
  }

  function handleTimeZoneChange(option: TimeZoneOption | null) {
    if (!option) {
      return
    }

    form.setValue('region', option.code, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: isSubmitted,
    })
    setTimeParts(toTimeParts(formatTimeInputValue(new Date(), option.timeZone)))
  }

  function handleTimePartChange(part: keyof TimeParts, value: string, onComplete?: () => void) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 2)

    setTimePart(part, digitsOnly)

    if (part === 'hour' && digitsOnly.length === 2) {
      window.setTimeout(() => onComplete?.(), 0)
    }
  }

  function handleTimePartStep(part: keyof TimeParts, step: number) {
    const currentValue = Number(submittedTime[part])
    const current = Number.isFinite(currentValue) ? currentValue : 0
    const max = part === 'hour' ? 23 : 59
    const next = wrapNumber(current + step, 0, max)

    setTimePart(part, String(next).padStart(2, '0'), false)
  }

  function handleTimePartBoundary(part: keyof TimeParts, boundary: 'min' | 'max') {
    setTimePart(part, boundary === 'min' ? '00' : part === 'hour' ? '23' : '59', false)
  }

  function handleTimePartBlur(part: keyof TimeParts) {
    const value = submittedTime[part]

    if (part === 'hour' && isValidHour(value)) {
      setTimePart('hour', value.padStart(2, '0'))
    }

    if (part === 'minute' && isValidMinute(value)) {
      setTimePart('minute', value.padStart(2, '0'))
    }
  }

  function handlePickerChange(value: Dayjs | null) {
    if (!value) {
      return
    }

    setTimeParts({
      hour: String(value.hour()).padStart(2, '0'),
      minute: String(value.minute()).padStart(2, '0'),
    })
  }

  return {
    errors,
    handlePickerChange,
    handleSubmit: form.handleSubmit(async (values) => {
      const timeZone = timeZoneOptions.find((option) => option.code === values.region) ?? timeZoneOptions[0]
      const submittedTime = {
        hour: values.hour,
        minute: values.minute,
      }

      await onSubmit({
        amount: 125.5,
        currency: 'ILS',
        merchantName: 'Terminal 42',
        region: timeZone.code,
        submittedAt: toUtcIsoStringForTimeZone(toTimeString(submittedTime), timeZone.timeZone),
      })
    }),
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
    timePickerValue: toDayjsTime(submittedTime),
    timeZoneOptions,
  }
}

function createDefaultValues(timeZone: string): FocusedTransactionFormValues {
  const currentTime = toTimeParts(formatTimeInputValue(new Date(), timeZone))

  return {
    ...currentTime,
    region: 'IL',
  }
}
