import { useMemo } from 'react'
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form'
import { useLocalization } from '../../../app/LocalizationContext'
import type { CreateTransactionRequest, RegionCode } from '../transactionTypes'

export type TransactionFormValues = {
  amount: string
  currency: string
  merchantName: string
  region: RegionCode
  submittedAtUtc: string
}

type UseTransactionFormOptions = {
  onSubmit: (request: CreateTransactionRequest) => Promise<void>
}

const defaultValues: TransactionFormValues = {
  amount: '125.50',
  currency: 'ILS',
  merchantName: 'Terminal 42',
  region: 'IL',
  submittedAtUtc: formatUtcInputValue(new Date()),
}

export function useTransactionForm({ onSubmit }: UseTransactionFormOptions) {
  const { t } = useLocalization()
  const resolver = useMemo<Resolver<TransactionFormValues>>(() => async (values) => {
    const errors: FieldErrors<TransactionFormValues> = {}
    const amount = Number(values.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = { message: t('validation.amount'), type: 'validate' }
    }

    if (values.currency.trim().length !== 3) {
      errors.currency = { message: t('validation.currency'), type: 'validate' }
    }

    const merchantName = values.merchantName.trim()
    if (merchantName.length === 0 || merchantName.length > 120) {
      errors.merchantName = { message: t('validation.merchantName'), type: 'validate' }
    }

    if (Number.isNaN(new Date(toUtcIsoString(values.submittedAtUtc)).getTime())) {
      errors.submittedAtUtc = { message: t('validation.submittedAt'), type: 'validate' }
    }

    return {
      errors,
      values: Object.keys(errors).length === 0 ? values : {},
    }
  }, [t])
  const form = useForm<TransactionFormValues>({
    defaultValues,
    resolver,
  })
  const { errors, isSubmitted } = form.formState
  const showErrors = isSubmitted && Object.keys(errors).length > 0

  return {
    control: form.control,
    errors,
    handleSubmit: form.handleSubmit(async (values) => {
      await onSubmit({
        amount: Number(values.amount),
        currency: values.currency.trim().toUpperCase(),
        merchantName: values.merchantName.trim(),
        region: values.region,
        submittedAt: toUtcIsoString(values.submittedAtUtc),
      })
    }),
    isSubmitted,
    showErrors,
  }
}

function toUtcIsoString(value: string) {
  const date = new Date(`${value}:00`)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString()
}

function formatUtcInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
