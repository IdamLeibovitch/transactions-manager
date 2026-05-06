# Backend

.NET solution for:

- `GatewayApi`
- `TransactionProcessor`
- `NotificationService`
- shared building blocks

## Projects

- `BuildingBlocks/Contracts`: shared API, event, region, time, and messaging contracts.
- `GatewayApi`: public REST API host.
- `TransactionProcessor`: worker service host.
- `NotificationService`: SignalR notification host.

## Local Ports

- Gateway API: `http://localhost:5080`
- Notification service: `http://localhost:5081`

## Gateway API

The gateway owns transaction persistence. On startup it applies EF Core migrations to the configured SQL Server database.
