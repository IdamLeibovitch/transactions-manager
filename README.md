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

## Full Containerized Run

Prerequisites:

- Docker Desktop or another Docker Compose runtime.
- .NET SDK `10`.
- Node.js and npm.

Create local environment settings if you do not already have `.env`:

```bash
cp .env.example .env
```

Run the whole stack, including the production-built client:

```bash
docker compose up --build
```

Open `http://localhost:5173`.

The client is served from an Nginx container. Nginx proxies `/api` to `gateway-api` and `/ws` to `notification-service`, so the browser only needs the client URL.

## Local Development

For frontend work, use Vite on the host so React changes hot reload immediately. Run the backend and infrastructure in Docker with the development override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mssql rabbitmq gateway-api transaction-processor notification-service
```

Then run the client from the host:

```bash
cd src/client
npm install
npm run dev
```

Open `http://localhost:5173`.

The development override publishes `gateway-api` on `5080` and `notification-service` on `5081`, matching the Vite defaults in `.env.example`.

VS Code also has a `Client` launch configuration that starts the development backend containers, starts Vite, and opens `http://localhost:5173`.

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
- [docs/local-development.md](docs/local-development.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api-contracts.md](docs/api-contracts.md)
- [docs/events.md](docs/events.md)
- [docs/time-zone-strategy.md](docs/time-zone-strategy.md)
- [docs/local-infrastructure.md](docs/local-infrastructure.md)
