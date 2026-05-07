import * as signalR from '@microsoft/signalr'
import type { TransactionStatusChangedMessage } from './transactionTypes'

const signalRUrl = import.meta.env.VITE_SIGNALR_URL ?? 'http://localhost:5081/ws/transactions'

export type TransactionsHubHandlers = {
  accessToken: string
  onReconnecting: () => void
  onReconnected: () => void
  onClose: () => void
  onStatusChanged: (message: TransactionStatusChangedMessage) => void
}

export function createTransactionsHubConnection(handlers: TransactionsHubHandlers) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(signalRUrl, {
      accessTokenFactory: () => handlers.accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  connection.on('transactionStatusChanged', handlers.onStatusChanged)
  connection.onreconnecting(handlers.onReconnecting)
  connection.onreconnected(handlers.onReconnected)
  connection.onclose(handlers.onClose)

  return connection
}
