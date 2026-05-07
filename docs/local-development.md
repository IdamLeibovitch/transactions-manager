# Local Development

Use this workflow when changing the React client. The full Docker client is production-style Nginx, so it does not hot reload source changes. For fast frontend iteration, run Vite on the host and run the backend services in Docker.

## Start Backend Containers

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mssql rabbitmq gateway-api transaction-processor notification-service
```

The development override publishes:

| Service | URL |
| --- | --- |
| Gateway API | `http://localhost:5080` |
| Notification SignalR hub | `http://localhost:5081/ws/transactions` |
| RabbitMQ Management | `http://localhost:15673` |

## Start the Client with Hot Reload

```bash
cd src/client
npm install
npm run dev
```

Open `http://localhost:5173`.

The client defaults are:

```text
VITE_API_BASE_URL=http://localhost:5080
VITE_SIGNALR_URL=http://localhost:5081/ws/transactions
```

## VS Code

1. Open Run and Debug.
2. Select `Client`.

The `Client` launch configuration starts the backend containers with `docker-compose.dev.yml`, starts `npm run dev` in `src/client`, and opens Chrome at `http://localhost:5173`.

Use the existing `Backend Services` compound when debugging the .NET services from the host instead of Docker.

## Full Containerized Demo

Use this when you want the production-like single-command demo:

```bash
docker compose up --build
```

Open `http://localhost:5173`.

In this mode the React app is built into the client image and served by Nginx. Rebuild the image to see client source changes:

```bash
docker compose build client
docker compose up -d client
```
