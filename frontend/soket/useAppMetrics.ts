'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './SocketProvider'

// Hook untuk real-time alerts
export function useAlerts() {
  const { socket, isConnected, on, off } = useSocket()
  const [alerts, setAlerts] = useState<any[]>([])
  const [activeAlerts, setActiveAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !socket) return

    const handleAlertNew = (alert: any) => {
      setAlerts(prev => [alert, ...prev.slice(0, 99)]) // Keep last 100 alerts
      if (alert.status === 'active') {
        setActiveAlerts(prev => [alert, ...prev])
      }
    }

    const handleAlertUpdate = (updatedAlert: any) => {
      setAlerts(prev => prev.map(alert =>
        alert.id === updatedAlert.id ? updatedAlert : alert
      ))

      setActiveAlerts(prev => {
        if (updatedAlert.status === 'resolved') {
          return prev.filter(alert => alert.id !== updatedAlert.id)
        } else {
          const existing = prev.find(alert => alert.id === updatedAlert.id)
          if (existing) {
            return prev.map(alert =>
              alert.id === updatedAlert.id ? updatedAlert : alert
            )
          } else {
            return [updatedAlert, ...prev]
          }
        }
      })
    }

    const handleAlertResolved = (alertId: string) => {
      setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId))
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'resolved', resolvedAt: new Date() } : alert
      ))
    }

    const handleAlertsError = (errorData: any) => {
      setError(errorData.message || 'Failed to load alerts')
      setIsLoading(false)
    }

    // Subscribe to alert events
    on('alert:new', handleAlertNew)
    on('alert:update', handleAlertUpdate)
    on('alert:resolved', handleAlertResolved)
    on('alerts:error', handleAlertsError)

    // Request initial alerts data
    socket.emit('alerts:request')

    return () => {
      off('alert:new', handleAlertNew)
      off('alert:update', handleAlertUpdate)
      off('alert:resolved', handleAlertResolved)
      off('alerts:error', handleAlertsError)
    }
  }, [socket, isConnected, on, off])

  const acknowledgeAlert = useCallback((alertId: string) => {
    if (socket && isConnected) {
      socket.emit('alert:acknowledge', { alertId })
    }
  }, [socket, isConnected])

  const resolveAlert = useCallback((alertId: string, notes?: string) => {
    if (socket && isConnected) {
      socket.emit('alert:resolve', { alertId, notes })
    }
  }, [socket, isConnected])

  return {
    alerts,
    activeAlerts,
    isLoading,
    error,
    acknowledgeAlert,
    resolveAlert
  }
}

// Hook untuk server status
export function useServers() {
  const { socket, isConnected, on, off } = useSocket()
  const [servers, setServers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !socket) return

    const handleServerUpdate = (server: any) => {
      setServers(prev => {
        const existingIndex = prev.findIndex(s => s.id === server.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], ...server }
          return updated
        } else {
          return [...prev, server]
        }
      })
    }

    const handleServerStatus = (data: any) => {
      setServers(prev => prev.map(server =>
        server.id === data.serverId
          ? { ...server, status: data.status, lastSeen: data.timestamp }
          : server
      ))
    }

    const handleServersError = (errorData: any) => {
      setError(errorData.message || 'Failed to load servers')
      setIsLoading(false)
    }

    // Subscribe to server events
    on('server:update', handleServerUpdate)
    on('server:status', handleServerStatus)
    on('servers:error', handleServersError)

    // Request initial servers data
    socket.emit('servers:request')

    return () => {
      off('server:update', handleServerUpdate)
      off('server:status', handleServerStatus)
      off('servers:error', handleServersError)
    }
  }, [socket, isConnected, on, off])

  const refreshServers = useCallback(() => {
    if (socket && isConnected) {
      setIsLoading(true)
      setError(null)
      socket.emit('servers:request')
    }
  }, [socket, isConnected])

  return {
    servers,
    isLoading,
    error,
    refreshServers,
    onlineServers: servers.filter(s => s.status === 'online'),
    offlineServers: servers.filter(s => s.status === 'offline')
  }
}

// Hook untuk application metrics (response time, error rate, uptime, connections)
export function useAppMetrics() {
  const { socket, isConnected, on, off } = useSocket()
  const [appMetrics, setAppMetrics] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !socket) return

    const handleAppMetricsUpdate = (data: any) => {
      setAppMetrics(prev => ({
        ...prev,
        [data.appId || 'default']: {
          ...prev[data.appId || 'default'],
          ...data,
          timestamp: Date.now()
        }
      }))
    }

    const handleAppMetricsError = (errorData: any) => {
      setError(errorData.message || 'Failed to load application metrics')
      setIsLoading(false)
    }

    // Subscribe to application metrics events
    on('app:metrics:update', handleAppMetricsUpdate)
    on('app:metrics:error', handleAppMetricsError)

    // Request initial application metrics
    socket.emit('app:metrics:request')

    return () => {
      off('app:metrics:update', handleAppMetricsUpdate)
      off('app:metrics:error', handleAppMetricsError)
    }
  }, [socket, isConnected, on, off])

  const refreshAppMetrics = useCallback(() => {
    if (socket && isConnected) {
      setIsLoading(true)
      setError(null)
      socket.emit('app:metrics:request')
    }
  }, [socket, isConnected])

  return {
    appMetrics,
    isLoading,
    error,
    refreshAppMetrics,
    currentMetrics: Object.values(appMetrics)[0] as any
  }
}

// Hook untuk response time metrics
export function useResponseTimeMetrics() {
  const { currentMetrics } = useAppMetrics()

  const responseData = currentMetrics?.responseTime ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    responseTime: currentMetrics.responseTime.avg || 0,
    requestCount: currentMetrics.responseTime.requests || 0,
    errorCount: currentMetrics.responseTime.errors || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: responseData,
    currentResponse: currentMetrics?.responseTime,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk error rate metrics
export function useErrorRateMetrics() {
  const { currentMetrics } = useAppMetrics()

  const errorData = currentMetrics?.errorRate ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    totalRequests: currentMetrics.errorRate.totalRequests || 0,
    successfulRequests: currentMetrics.errorRate.successfulRequests || 0,
    error4xx: currentMetrics.errorRate.error4xx || 0,
    error5xx: currentMetrics.errorRate.error5xx || 0,
    timeoutErrors: currentMetrics.errorRate.timeoutErrors || 0,
    networkErrors: currentMetrics.errorRate.networkErrors || 0,
    errorRate: currentMetrics.errorRate.rate || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: errorData,
    currentErrors: currentMetrics?.errorRate,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk uptime metrics
export function useUptimeMetrics() {
  const { currentMetrics } = useAppMetrics()

  const uptimeData = currentMetrics?.uptime ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    uptime: currentMetrics.uptime.percentage || 0,
    downtime: currentMetrics.uptime.downtime || 0,
    totalTime: currentMetrics.uptime.totalTime || 0,
    incidents: currentMetrics.uptime.incidents || 0,
    mttr: currentMetrics.uptime.mttr || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: uptimeData,
    currentUptime: currentMetrics?.uptime,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk connection metrics
export function useConnectionMetrics() {
  const { currentMetrics } = useAppMetrics()

  const connectionData = currentMetrics?.connections ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    activeConnections: currentMetrics.connections.active || 0,
    maxConnections: currentMetrics.connections.max || 1000,
    newConnections: currentMetrics.connections.new || 0,
    closedConnections: currentMetrics.connections.closed || 0,
    connectionRate: currentMetrics.connections.rate || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: connectionData,
    currentConnections: currentMetrics?.connections,
    isOnline: currentMetrics?.status === 'online'
  }
}