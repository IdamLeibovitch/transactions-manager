# Setup

This project is optimized for a local interview demo. Infrastructure runs in Docker Compose, while the app services run directly from the host so they are easy to debug and explain.

## Prerequisites

- Docker Desktop or another Docker Compose runtime.
- .NET SDK `10`.
- Node.js and npm.

## Environment

Create a local `.env` file:

```bash
cp .env.example .env
```

The checked-in `.env.example` contains development-only credentials:

| Setting | Default |
| --- | --- |
| SQL Server password | `Change_this_password_123!` |
| RabbitMQ username | `guest` |
| RabbitMQ password | `guest` |
| JWT issuer | `transactions-manager` |
| JWT audience | `transactions-manager-client` |
| JWT expiration | `60` minutes |
| App username | `admin` |
| App password | `Pass123!` |

Do not reuse these secrets outside local development.

## Start Infrastructure

```bash
docker compose up -d mssql rabbitmq
```

Useful checks:

```bash
docker compose ps
```

## Start Backend Services

Run each command in a separate terminal:

```bash
dotnet run --project src/backend/GatewayApi/TransactionsManager.GatewayApi.csproj
```

```bash
dotnet run --project src/backend/TransactionProcessor/TransactionsManager.TransactionProcessor.csproj
```

```bash
dotnet run --project src/backend/NotificationService/TransactionsManager.NotificationService.csproj
```

The gateway applies EF Core migrations on startup, so a separate migration command is not required for normal local setup.

Service health checks:

```bash
curl http://localhost:5080/health
curl http://localhost:5081/health
```

## Start Frontend

```bash
cd src/client
npm install
npm run dev
```

Open `http://localhost:5173`.

The client reads these optional environment variables:

| Variable | Default |
| --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5080` |
| `VITE_SIGNALR_URL` | `http://localhost:5081/ws/transactions` |

## Ports

| Service | Port | Notes |
| --- | ---: | --- |
| Client | `5173` | Vite dev server |
| Gateway API | `5080` | REST API and auth |
| Notification service | `5081` | SignalR hub |
| MSSQL | `1433` | SQL Server Developer edition |
| RabbitMQ AMQP | `5673` | Host port mapped to container `5672` |
| RabbitMQ Management | `15673` | Browser UI |

RabbitMQ management is available at `http://localhost:15673` with `guest` / `guest`.

## Tests and Checks

Backend:

```bash
dotnet test src/backend/TransactionsManager.sln
```

Frontend:

```bash
cd src/client
npm run lint
npm run build
```

`npm run build` creates `src/client/dist`; treat it as generated output.

## Reset Local Data

Stop containers:

```bash
docker compose down
```

Remove persisted SQL Server and RabbitMQ volumes:

```bash
docker compose down -v
```

## Troubleshooting

If submitted transactions stay pending, make sure `transaction-processor` is running and RabbitMQ is healthy.

If approved transactions are not updating in the browser, make sure `notification-service` is running and the client is using `http://localhost:5081/ws/transactions`.

If API calls return `401`, sign in again. Tokens are intentionally short-lived in development and the client clears stale sessions.

If SQL Server fails to start, check that port `1433` is free or override `MSSQL_PORT` in `.env`.
