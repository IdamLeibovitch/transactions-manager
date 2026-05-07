# Transaction Approval Simulator

Take-home full-stack assignment for Shva.

The app simulates transaction approval based on local banking hours. A submitted transaction is approved only when the submitted instant maps to local time between `08:00` and `18:00` in the selected region.

## What is included

- React, TypeScript, Vite frontend.
- Material UI, responsive focused and detailed views.
- English and Hebrew localization with RTL support.
- Simple JWT authentication for local development.
- .NET/C# backend services.
- MSSQL persistence.
- RabbitMQ event flow.
- SignalR transaction status notifications.
- Unit and e2e backend tests.

## Architecture

This is a small monorepo with a microservice-inspired backend:

- `src/client`: React + Material UI frontend.
- `src/backend/GatewayApi`: public REST API, validation, authentication, persistence, event publishing, and processed-event consumption.
- `src/backend/TransactionProcessor`: worker service that evaluates the banking-hours approval rule.
- `src/backend/NotificationService`: SignalR hub and processed-event consumer.
- `src/backend/BuildingBlocks/Contracts`: shared API, event, auth, region, and transaction contracts.
- `mssql`: SQL Server database, run through Docker Compose.
- `rabbitmq`: message broker, run through Docker Compose.

See [docs/architecture.md](docs/architecture.md) for the full flow and service boundaries.

## Quick start

Prerequisites:

- Docker Desktop or another Docker Compose runtime.
- .NET SDK `10`.
- Node.js and npm.

Create local environment settings if you do not already have `.env`:

```bash
cp .env.example .env
```

Run the whole stack:

```bash
docker compose up --build
```

Open `http://localhost:5173`.

The client is served from an Nginx container. Nginx proxies `/api` to `gateway-api` and `/ws` to `notification-service`, so the browser only needs the client URL.

For backend debugging, you can still run only the infrastructure containers:

```bash
docker compose up -d mssql rabbitmq
```

Then run the backend services from the host in separate terminals:

```bash
dotnet run --project src/backend/GatewayApi/TransactionsManager.GatewayApi.csproj
dotnet run --project src/backend/TransactionProcessor/TransactionsManager.TransactionProcessor.csproj
dotnet run --project src/backend/NotificationService/TransactionsManager.NotificationService.csproj
```

The gateway applies EF Core migrations on startup.

Development login:

- Username: `admin`
- Password: `Pass123!`

## Local URLs

| Service | URL |
| --- | --- |
| Client | `http://localhost:5173` |
| Gateway API | Proxied through `http://localhost:5173/api` in Compose; direct `http://localhost:5080` in host development |
| Notification SignalR hub | Proxied through `http://localhost:5173/ws/transactions` in Compose; direct `http://localhost:5081/ws/transactions` in host development |
| Gateway service info | `http://localhost:5173/api/service-info` |
| RabbitMQ Management | `http://localhost:15673` |

RabbitMQ management uses `guest` / `guest` by default.

## Verification

Backend tests:

```bash
dotnet test src/backend/TransactionsManager.sln
```

Frontend checks:

```bash
cd src/client
npm run lint
npm run build
```

After a frontend build, `src/client/dist` is generated output and should not be committed.

## More docs

- [docs/setup.md](docs/setup.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api-contracts.md](docs/api-contracts.md)
- [docs/events.md](docs/events.md)
- [docs/time-zone-strategy.md](docs/time-zone-strategy.md)
- [docs/local-infrastructure.md](docs/local-infrastructure.md)
