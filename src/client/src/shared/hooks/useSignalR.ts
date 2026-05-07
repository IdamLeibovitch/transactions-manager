import * as signalR from '@microsoft/signalr'
import { useEffect, useState } from 'react'

type SignalREventHandler<TPayload = unknown> = {
  eventName: string
  handler: (payload: TPayload) => void
}

type UseSignalROptions<TPayload = unknown> = {
  accessToken: string | null
  enabled?: boolean
  eventHandlers?: SignalREventHandler<TPayload>[]
  onUnauthorized?: () => void
  retryDelayMs?: number
  url: string
}

type UseSignalRResult = {
  isConnected: boolean
}

export function useSignalR<TPayload = unknown>({
  accessToken,
  enabled = true,
  eventHandlers = [],
  onUnauthorized,
  retryDelayMs = 2000,
  url,
}: UseSignalROptions<TPayload>): UseSignalRResult {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !accessToken) {
      return
    }

    let disposed = false

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    for (const eventHandler of eventHandlers) {
      connection.on(eventHandler.eventName, (payload: TPayload) => eventHandler.handler(payload))
    }

    connection.onclose(() => {
      if (!disposed) {
        setIsConnected(false)
      }
    })
    connection.onreconnected(() => {
      if (!disposed) {
        setIsConnected(true)
      }
    })
    connection.onreconnecting(() => {
      if (!disposed) {
        setIsConnected(false)
      }
    })

    async function startConnection() {
      while (!disposed) {
        try {
          await connection.start()

          if (!disposed) {
            setIsConnected(true)
          }

          return
        } catch (error) {
          if (isUnauthorizedConnectionError(error)) {
            onUnauthorized?.()
            return
          }

          if (!disposed) {
            setIsConnected(false)
          }

          await delay(retryDelayMs)
        }
      }
    }

    void startConnection()

    return () => {
      disposed = true
      setIsConnected(false)
      void connection.stop()
    }
  }, [accessToken, enabled, eventHandlers, onUnauthorized, retryDelayMs, url])

  return { isConnected: Boolean(enabled && accessToken && isConnected) }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function isUnauthorizedConnectionError(error: unknown) {
  return error instanceof Error && /(?:401|Unauthorized)/i.test(error.message)
}
