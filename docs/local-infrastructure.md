# Local Infrastructure

Start local infrastructure:

```bash
docker compose up -d mssql rabbitmq
```

Stop local infrastructure:

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
