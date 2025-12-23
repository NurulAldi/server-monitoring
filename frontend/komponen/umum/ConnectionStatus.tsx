'use client'

import { useSocket } from '@/soket/SocketProvider'

export function ConnectionStatus() {
  const { isConnected, connectionError, reconnectAttempts } = useSocket()

  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-body-small text-slate-600">Connected</span>
        </div>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white border-2 border-red-500 rounded-lg px-3 py-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="flex flex-col">
            <span className="text-body-small text-red-600 font-semibold">Disconnected</span>
            {reconnectAttempts > 0 && (
              <span className="text-xs text-slate-500">
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
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-body-small text-slate-600">Connecting...</span>
      </div>
    </div>
  )
}

export default ConnectionStatus