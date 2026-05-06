# Architecture

## Flow

1. Client submits a transaction to `gateway-api`.
2. Gateway validates the request and JWT.
3. Gateway stores the transaction as `Pending`.
4. Gateway publishes `TransactionSubmitted.v1` to RabbitMQ.
5. `transaction-processor` consumes `TransactionSubmitted.v1`.
6. Processor converts the submitted instant to the selected region's local time.
7. Processor determines `Approved` or `Rejected`.
8. Processor publishes `TransactionProcessed.v1`.
9. Gateway consumes `TransactionProcessed.v1` and updates MSSQL.
10. `notification-service` consumes `TransactionProcessed.v1`.
11. Notification service sends a SignalR status update.
12. Client updates its UI and shows approved transactions in the bottom cards.

## Boundaries

`gateway-api` owns the database writes.

`transaction-processor` owns the approval rule.

`notification-service` owns client push notifications.

The services share DTOs through `BuildingBlocks/Contracts` to keep the assignment readable. In a larger system these contracts would become independently versioned packages.

## Required Simplifications

- One MSSQL database.
- One RabbitMQ broker.
- No Kubernetes.
- No Kafka.
- No distributed transaction coordinator.
- No separate auth service in the first implementation.
- No banking holidays or weekend rules unless added later.

