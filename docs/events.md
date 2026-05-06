# Event Contracts

Events are versioned and treated as immutable contracts.

## TransactionSubmitted.v1

Exchange: `transactions.submitted`

Consumer queue:

- `transaction-processor.transactions-submitted`

```json
{
  "eventId": "bde6766d-710c-4552-946b-63d0abdb01a2",
  "occurredAtUtc": "2026-05-06T10:31:00Z",
  "transactionId": "4c9b9ec4-9f2e-42ab-8d49-2bc2a0f4e91c",
  "amount": 125.5,
  "currency": "ILS",
  "merchantName": "Demo Store",
  "region": "IL",
  "submittedAtUtc": "2026-05-06T10:30:00Z",
  "correlationId": "7d14cf69-9cf0-4c88-a423-5dc01a014001"
}
```

## TransactionProcessed.v1

Exchange: `transactions.processed`

Consumer queues:

- `gateway-api.transactions-processed`
- `notification-service.transactions-processed`

```json
{
  "eventId": "c3b3536c-68b6-4a6e-8795-f8fd2716d2f7",
  "occurredAtUtc": "2026-05-06T10:31:02Z",
  "transactionId": "4c9b9ec4-9f2e-42ab-8d49-2bc2a0f4e91c",
  "status": "Approved",
  "region": "IL",
  "timeZoneId": "Asia/Jerusalem",
  "submittedAtUtc": "2026-05-06T10:30:00Z",
  "localSubmittedAt": "2026-05-06T13:30:00",
  "decisionReason": "Within banking hours",
  "correlationId": "7d14cf69-9cf0-4c88-a423-5dc01a014001"
}
```

