'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './SocketProvider'

// Hook untuk real-time metrics data
export function useMetrics(serverId?: string) {
  const { socket, isConnected, on, off } = useSocket()
  const [metrics, setMetrics] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !socket) return

    const handleMetricsUpdate = (data: any) => {
      setMetrics(prev => ({
        ...prev,
        [data.serverId || 'default']: {
          ...prev[data.serverId || 'default'],
          ...data,
          timestamp: Date.now()
        }
      }))
    }

    const handleMetricsError = (errorData: any) => {
      setError(errorData.message || 'Failed to load metrics')
      setIsLoading(false)
    }

    // Subscribe to metrics events
    on('metrics:update', handleMetricsUpdate)
    on('metrics:error', handleMetricsError)

    // Join server-specific room if serverId provided
    if (serverId) {
      socket.emit('join:server', serverId)
    }

    // Request initial metrics data
    socket.emit('metrics:request', { serverId })

    return () => {
      off('metrics:update', handleMetricsUpdate)
      off('metrics:error', handleMetricsError)

      if (serverId) {
        socket.emit('leave:server', serverId)
      }
    }
  }, [socket, isConnected, serverId, on, off])

  const refreshMetrics = useCallback(() => {
    if (socket && isConnected) {
      setIsLoading(true)
      setError(null)
      socket.emit('metrics:request', { serverId })
    }
  }, [socket, isConnected, serverId])

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    currentMetrics: serverId ? metrics[serverId] : Object.values(metrics)[0]
  }
}

// Hook untuk CPU metrics
export function useCPUMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const cpuData = currentMetrics?.cpu ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    usage: currentMetrics.cpu.usage || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: cpuData,
    currentUsage: currentMetrics?.cpu?.usage || 0,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk memory metrics
export function useMemoryMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const memoryData = currentMetrics?.memory ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    used: currentMetrics.memory.used || 0,
    available: currentMetrics.memory.available || 0,
    total: currentMetrics.memory.total || 0,
    usagePercent: currentMetrics.memory.usagePercent || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: memoryData,
    currentMemory: currentMetrics?.memory,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk network metrics
export function useNetworkMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const networkData = currentMetrics?.network ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    upload: currentMetrics.network.upload || 0,
    download: currentMetrics.network.download || 0,
    total: (currentMetrics.network.upload || 0) + (currentMetrics.network.download || 0),
    packetsIn: currentMetrics.network.packetsIn || 0,
    packetsOut: currentMetrics.network.packetsOut || 0,
    errors: currentMetrics.network.errors || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: networkData,
    currentNetwork: currentMetrics?.network,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk disk metrics
export function useDiskMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const diskData = currentMetrics?.disk ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    used: currentMetrics.disk.used || 0,
    available: currentMetrics.disk.available || 0,
    total: currentMetrics.disk.total || 0,
    usagePercent: currentMetrics.disk.usagePercent || 0,
    readSpeed: currentMetrics.disk.readSpeed || 0,
    writeSpeed: currentMetrics.disk.writeSpeed || 0,
    iops: currentMetrics.disk.iops || 0,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: diskData,
    currentDisk: currentMetrics?.disk,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk system load metrics
export function useLoadMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const loadData = currentMetrics?.load ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    load1: currentMetrics.load.load1 || 0,
    load5: currentMetrics.load.load5 || 0,
    load15: currentMetrics.load.load15 || 0,
    cpuCount: currentMetrics.load.cpuCount || 4,
    loadPercent: Math.round(((currentMetrics.load.load1 || 0) / (currentMetrics.load.cpuCount || 4)) * 100),
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: loadData,
    currentLoad: currentMetrics?.load,
    isOnline: currentMetrics?.status === 'online'
  }
}

// Hook untuk temperature metrics
export function useTemperatureMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const tempData = currentMetrics?.temperature ? [{
    waktu: new Date(currentMetrics.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    cpu: currentMetrics.temperature.cpu || 0,
    gpu: currentMetrics.temperature.gpu,
    motherboard: currentMetrics.temperature.motherboard || 0,
    disk: currentMetrics.temperature.disk || 0,
    ambient: currentMetrics.temperature.ambient || 0,
    maxTemp: currentMetrics.temperature.maxTemp || 80,
    timestamp: currentMetrics.timestamp
  }] : []

  return {
    data: tempData,
    currentTemp: currentMetrics?.temperature,
    isOnline: currentMetrics?.status === 'online'
  }
}