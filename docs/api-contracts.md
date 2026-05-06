# API Contracts

Base path: `/api`.

## Auth

`POST /api/auth/login`

Request:

```json
{
  "username": "demo",
  "password": "demo"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "expiresAtUtc": "2026-05-06T12:00:00Z"
}
```

## Transactions

`POST /api/transactions`

Request:

```json
{
  "amount": 125.5,
  "currency": "ILS",
  "merchantName": "Demo Store",
  "region": "IL",
  "submittedAt": "2026-05-06T10:30:00Z"
}
```

Response:

```json
{
  "transactionId": "4c9b9ec4-9f2e-42ab-8d49-2bc2a0f4e91c",
  "status": "Pending"
}
```

`GET /api/transactions?status=Approved`

Response:

```json
[
  {
    "id": "4c9b9ec4-9f2e-42ab-8d49-2bc2a0f4e91c",
    "amount": 125.5,
    "currency": "ILS",
    "merchantName": "Demo Store",
    "region": "IL",
    "submittedAtUtc": "2026-05-06T10:30:00Z",
    "localSubmittedAt": "2026-05-06T13:30:00",
    "status": "Approved",
    "decisionReason": "Within banking hours",
    "createdAtUtc": "2026-05-06T10:31:00Z",
    "processedAtUtc": "2026-05-06T10:31:02Z"
  }
]
```

