# Git Commit Plan

Suggested commit sequence:

```text
chore: initialize monorepo structure
chore: add docker compose for mssql and rabbitmq
chore: create backend projects and shared contracts
feat(gateway): add jwt authentication
feat(gateway): add transaction persistence and submit endpoint
feat(messaging): publish transaction submitted events
feat(processor): process transaction approval rules
feat(gateway): consume processed events and update status
feat(notifications): add signalr transaction updates
feat(client): scaffold react vite mui app
feat(client): add localization and rtl support
feat(client): add transaction form and approved cards
feat(client): connect api and signalr updates
test: cover approval rules and gateway validation
docs: add setup, architecture, and demo flow
```

