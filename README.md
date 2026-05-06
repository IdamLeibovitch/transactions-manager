# Transaction Approval Simulator

Take-home full-stack assignment for Shva.

The app simulates transaction approval based on local banking hours. A transaction is approved only when the submitted instant maps to local time between `08:00` and `18:00` in the selected region.

## Scope

Core requirements:

- React, TypeScript, Vite frontend.
- Material UI.
- .NET/C# backend.
- MSSQL persistence.
- RabbitMQ event flow.
- SignalR transaction status notifications.
- Simple JWT authentication.
- English and Hebrew localization.
- Responsive UI based on the provided Figma layout.

Architecture style:

- One monorepo.
- Small, locally runnable, microservice-inspired services.
- RabbitMQ instead of Kafka for local development simplicity.
- Simple auth built into the backend unless a separate auth service becomes clearly useful.

## Services

- `client`: React + Material UI frontend.
- `gateway-api`: public REST API, validation, persistence, auth, event publishing, processed-event consumption.
- `transaction-processor`: worker service that evaluates approval rules.
- `notification-service`: SignalR hub and processed-event consumer.
- `mssql`: transaction database.
- `rabbitmq`: message broker.

## Current State

This commit only initializes the monorepo structure and planning docs. No application code has been implemented yet.

## Planned Local Ports

- Client: `5173`
- Gateway API: `5080`
- Notification service: `5081`
- RabbitMQ Management: `15673`
- RabbitMQ AMQP host port: `5673`
- MSSQL: `1433`

## Local Infrastructure

Run MSSQL and RabbitMQ:

```bash
docker compose up -d mssql rabbitmq
```

See [docs/local-infrastructure.md](docs/local-infrastructure.md) for details.
