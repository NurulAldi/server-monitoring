'use client'

import { useSocket } from '@/soket/SocketProvider'

export function ConnectionStatus() {
  const { isConnected, connectionError, reconnectAttempts } = useSocket()

  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-status-online animate-pulse"></div>
          <span className="text-body-small text-text-secondary">Connected</span>
        </div>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-bg-secondary border border-status-critical rounded-lg px-3 py-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-status-critical"></div>
          <div className="flex flex-col">
            <span className="text-body-small text-status-critical font-semibold">Disconnected</span>
            {reconnectAttempts > 0 && (
              <span className="text-xs text-text-muted">
                Reconnecting... ({reconnectAttempts})
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 shadow-lg">
        <div className="w-2 h-2 rounded-full bg-accent-tertiary animate-pulse"></div>
        <span className="text-body-small text-text-secondary">Connecting...</span>
      </div>
    </div>
  )
}

export default ConnectionStatus