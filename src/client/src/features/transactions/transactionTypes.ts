export type TransactionStatus = 'Pending' | 'Approved' | 'Rejected'

export type RegionCode = 'IL' | 'US_EAST' | 'UK' | 'EU_CENTRAL'

export type CreateTransactionRequest = {
  amount: number
  currency: string
  merchantName: string
  region: RegionCode
  submittedAt: string
}

export type CreateTransactionResponse = {
  transactionId: string
  status: TransactionStatus
}

export type TransactionDto = {
  id: string
  amount: number
  currency: string
  merchantName: string
  region: RegionCode
  submittedAtUtc: string
  localSubmittedAt: string | null
  status: TransactionStatus
  decisionReason: string | null
  createdAtUtc: string
  processedAtUtc: string | null
}

export type TransactionStatusChangedMessage = {
  transactionId: string
  status: TransactionStatus
  decisionReason: string | null
  processedAtUtc: string | null
}

export const regions: Array<{ code: RegionCode; translationKey: `region.${RegionCode}` }> = [
  { code: 'IL', translationKey: 'region.IL' },
  { code: 'US_EAST', translationKey: 'region.US_EAST' },
  { code: 'UK', translationKey: 'region.UK' },
  { code: 'EU_CENTRAL', translationKey: 'region.EU_CENTRAL' },
]
