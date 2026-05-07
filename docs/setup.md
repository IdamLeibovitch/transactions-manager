# Setup

This project is optimized for a local interview demo. The default setup runs the full stack with Docker Compose. For frontend development, run Vite on the host and the backend services in Docker with the development override.

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

## Full Containerized Run

Run the full stack:

```bash
docker compose up --build
```

Open `http://localhost:5173`.

The client container serves the built React app with Nginx. Nginx proxies `/api` to `gateway-api` and `/ws` to `notification-service`, so the browser uses a single origin.

Client source changes do not hot reload in this mode. Rebuild the client image after changes:

```bash
docker compose build client
docker compose up -d client
```

## Local Client Development

Run backend containers with host ports for the gateway and notification service:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mssql rabbitmq gateway-api transaction-processor notification-service
```

Run Vite on the host:

```bash
cd src/client
npm install
npm run dev
```

Open `http://localhost:5173`.

Useful checks:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
curl http://localhost:5080/health
curl http://localhost:5081/health
```

The client reads these optional environment variables:

| Variable | Default |
| --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5080` |
| `VITE_SIGNALR_URL` | `http://localhost:5081/ws/transactions` |

The Dockerized client is built with `VITE_API_BASE_URL` empty and `VITE_SIGNALR_URL=/ws/transactions`, so requests go through the Nginx proxy.

## VS Code

The repository includes a `Client` launch configuration. It starts the backend containers with the development override, starts Vite, and opens `http://localhost:5173`.

When the full Compose stack is running, the gateway is exposed through the client proxy:

```bash
curl http://localhost:5173/api/service-info
```

## Host Backend Debugging

Use these commands when you are running the .NET services from the host instead of Docker. Start only MSSQL and RabbitMQ first:

```bash
docker compose up -d mssql rabbitmq
```

Then run each service in a separate terminal:

```bash
dotnet run --project src/backend/GatewayApi/TransactionsManager.GatewayApi.csproj
dotnet run --project src/backend/TransactionProcessor/TransactionsManager.TransactionProcessor.csproj
dotnet run --project src/backend/NotificationService/TransactionsManager.NotificationService.csproj
```

The gateway applies EF Core migrations on startup, so a separate migration command is not required for normal local setup.

## Ports

| Service | Port | Notes |
| --- | ---: | --- |
| Client | `5173` | Nginx container for Compose, Vite dev server for host development |
| Gateway API | `5080` | Host-development port; in Compose it is internal and reachable through client `/api` proxy |
| Notification service | `5081` | Host-development port; in Compose it is internal and reachable through client `/ws` proxy |
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

If approved transactions are not updating in the browser, make sure `notification-service` is running. In the full Compose stack the client uses `/ws/transactions` through Nginx; in host development it uses `http://localhost:5081/ws/transactions`.

If API calls return `401`, sign in again. Tokens are intentionally short-lived in development and the client clears stale sessions.

If SQL Server fails to start, check that port `1433` is free or override `MSSQL_PORT` in `.env`.
