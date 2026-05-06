# Implementation Phases

## Phase 1: Local Infrastructure

- Add Docker Compose for MSSQL and RabbitMQ.
- Add backend appsettings conventions.
- Add health checks where useful.

## Phase 2: Backend Foundation

- Create shared contracts.
- Create gateway API.
- Create transaction processor worker.
- Create notification service.

## Phase 3: Persistence and Messaging

- Add EF Core transaction model.
- Store submitted transactions as `Pending`.
- Publish `TransactionSubmitted.v1`.
- Consume and process submitted events.
- Publish and consume `TransactionProcessed.v1`.

## Phase 4: Authentication

- Add simple JWT login endpoint.
- Protect transaction endpoints.
- Use the same JWT for SignalR access.

## Phase 5: Frontend

- Scaffold React + TypeScript + Vite.
- Add Material UI theme.
- Build responsive Figma-based layout.
- Add English and Hebrew localization.
- Connect REST API and SignalR updates.

## Phase 6: Polish

- Add README run instructions.
- Add focused tests for approval rules and API validation.
- Add demo script for the interview.

