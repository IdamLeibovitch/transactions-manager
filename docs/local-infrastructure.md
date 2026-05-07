# Local Infrastructure

Start the full local stack:

```bash
docker compose up --build
```

Start only local infrastructure for host-based debugging:

```bash
docker compose up -d mssql rabbitmq
```

Start backend containers with host ports for local Vite development:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mssql rabbitmq gateway-api transaction-processor notification-service
```

Stop the stack:

```bash
docker compose down
```

Remove local persisted data:

```bash
docker compose down -v
```

## Services

| Service | Port | Notes |
| --- | ---: | --- |
| Client | `5173` | Nginx-served React app in Compose |
| Gateway API | internal / `5080` in dev override | REST API and auth; proxied through client `/api` in full Compose |
| Notification service | internal / `5081` in dev override | SignalR hub; proxied through client `/ws` in full Compose |
| MSSQL | `1433` | SQL Server Developer edition |
| RabbitMQ | `5673` | AMQP broker on the host; services inside Docker use `rabbitmq:5672` |
| RabbitMQ Management | `15673` | Management UI on the host |

Default local credentials are defined in `.env.example`. For local development, copy that file to `.env` and change secrets if needed.

When running backend services from the host, use:

- MSSQL: `localhost,1433`
- RabbitMQ: `localhost:5673`

When running backend services inside Docker Compose, use:

- MSSQL: `mssql,1433`
- RabbitMQ: `rabbitmq:5672`
