'use client'

import { useCallback } from 'react'
import { useAlerts } from '@/soket'
import { useSocket } from '@/soket/SocketProvider'

export function useAlert() {
  const { alerts, isLoading, error, acknowledgeAlert, resolveAlert } = useAlerts()
  const { socket, isConnected } = useSocket()

  const ambilAlert = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('alerts:request')
    }
  }, [socket, isConnected])

  return {
    alert: alerts,
    memuat: isLoading,
    error,
    ambilAlert,
    acknowledgeAlert,
    resolveAlert
  }
}
