'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useSocket } from './SocketProvider'
import { klienApi } from '@/layanan/klienApi'

// Hook untuk real-time metrics data
export function useMetrics(serverId?: string) {
  const { socket, isConnected, on, off } = useSocket()
  const [metrics, setMetrics] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics from API
  const fetchMetricsFromAPI = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await klienApi.get('/api/monitoring/current')
      if (response.data.success) {
        const currentMetrics = response.data.data
        const newMetrics: any = {}

        currentMetrics.forEach((serverData: any) => {
          newMetrics[serverData.serverId] = {
            ...serverData.metrics,
            timestamp: new Date(serverData.timestamp).getTime(),
            status: 'online' // Assume online if we have metrics
          }
        })

        setMetrics(newMetrics)
      }
    } catch (err) {
      setError('Failed to fetch metrics from API')
      console.error('API metrics fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch from API first
    fetchMetricsFromAPI()

    // Set up polling every 30 seconds
    const interval = setInterval(fetchMetricsFromAPI, 30000)

    // Also listen to socket events if available
    if (isConnected && socket) {
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
        clearInterval(interval)
        off('metrics:update', handleMetricsUpdate)
        off('metrics:error', handleMetricsError)

        if (serverId) {
          socket.emit('leave:server', serverId)
        }
      }
    }

    return () => clearInterval(interval)
  }, [socket, isConnected, serverId, on, off, fetchMetricsFromAPI])

  const refreshMetrics = useCallback(() => {
    if (socket && isConnected) {
      setIsLoading(true)
      setError(null)
      socket.emit('metrics:request', { serverId })
    } else {
      fetchMetricsFromAPI()
    }
  }, [socket, isConnected, serverId, fetchMetricsFromAPI])

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

  const cpuData = useMemo(() => {
    if (!currentMetrics) return []

    return [{
      waktu: new Date(currentMetrics.timestamp || Date.now()).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      usage: currentMetrics.cpu || 0,
      timestamp: currentMetrics.timestamp || Date.now()
    }]
  }, [currentMetrics?.cpu, currentMetrics?.timestamp])

  return {
    data: cpuData,
    currentUsage: currentMetrics?.cpu || 0,
    isOnline: currentMetrics?.status === 'online' || !!currentMetrics
  }
}

// Hook untuk memory metrics
export function useMemoryMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const memoryData = useMemo(() => {
    if (!currentMetrics) return []

    return [{
      waktu: new Date(currentMetrics.timestamp || Date.now()).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      used: currentMetrics.memori || 0,
      available: 100 - (currentMetrics.memori || 0), // Calculate available
      total: 100, // Percentage based
      usagePercent: currentMetrics.memori || 0,
      timestamp: currentMetrics.timestamp || Date.now()
    }]
  }, [currentMetrics?.memori, currentMetrics?.timestamp])

  return {
    data: memoryData,
    currentMemory: {
      used: currentMetrics?.memori || 0,
      available: 100 - (currentMetrics?.memori || 0),
      total: 100,
      usagePercent: currentMetrics?.memori || 0
    },
    isOnline: currentMetrics?.status === 'online' || !!currentMetrics
  }
}

// Hook untuk network metrics
export function useNetworkMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)
  const [throttledData, setThrottledData] = useState<any[]>([])
  const lastUpdateRef = useRef(0)
  const lastTimestampRef = useRef(0)

  // Point 5: Strict useMemo with primitive dependencies only
  const timestamp = currentMetrics?.timestamp || 0
  const hasNetwork = Boolean(currentMetrics?.jaringan)

  const networkData = useMemo(() => {
    if (!hasNetwork || !currentMetrics?.jaringan) return []

    return [{
      waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      upload: currentMetrics.jaringan.uploadMbps || 0,
      download: currentMetrics.jaringan.downloadMbps || 0,
      total: (currentMetrics.jaringan.uploadMbps || 0) + (currentMetrics.jaringan.downloadMbps || 0),
      packetsIn: 0, // Not available in API
      packetsOut: 0, // Not available in API
      errors: 0, // Not available in API
      timestamp
    }]
  }, [hasNetwork, timestamp]) // Primitive dependencies only

  // Point 4: Effect audit - prevent infinite loop by checking timestamp change
  useEffect(() => {
    if (timestamp === lastTimestampRef.current) return // No change, skip update

    const now = Date.now()
    if (now - lastUpdateRef.current > 1000) { // Throttle to 1 second
      setThrottledData(networkData)
      lastUpdateRef.current = now
      lastTimestampRef.current = timestamp
    }
  }, [timestamp, networkData]) // Primitive dependency prevents loop

  return {
    data: throttledData,
    currentNetwork: currentMetrics?.jaringan ? {
      upload: currentMetrics.jaringan.uploadMbps || 0,
      download: currentMetrics.jaringan.downloadMbps || 0,
      total: (currentMetrics.jaringan.uploadMbps || 0) + (currentMetrics.jaringan.downloadMbps || 0),
      packetsIn: 0,
      packetsOut: 0,
      errors: 0
    } : null,
    isOnline: currentMetrics?.status === 'online' || !!currentMetrics
  }
}

// Hook untuk disk metrics
export function useDiskMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  const diskData = useMemo(() => {
    if (!currentMetrics?.disk) return []

    return [{
      waktu: new Date(currentMetrics.timestamp || Date.now()).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      used: currentMetrics.disk || 0,
      available: 100 - (currentMetrics.disk || 0), // Calculate available
      total: 100, // Percentage based
      usagePercent: currentMetrics.disk || 0,
      readSpeed: 0, // Not available in API
      writeSpeed: 0, // Not available in API
      iops: 0, // Not available in API
      timestamp: currentMetrics.timestamp || Date.now()
    }]
  }, [currentMetrics?.disk, currentMetrics?.timestamp])

  return {
    data: diskData,
    currentDisk: currentMetrics?.disk ? {
      used: currentMetrics.disk || 0,
      available: 100 - (currentMetrics.disk || 0),
      total: 100,
      usagePercent: currentMetrics.disk || 0,
      readSpeed: 0,
      writeSpeed: 0,
      iops: 0
    } : null,
    isOnline: currentMetrics?.status === 'online' || !!currentMetrics
  }
}

// Hook untuk system load metrics
export function useLoadMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  // Load data not available in current API, return empty
  const loadData = []

  return {
    data: loadData,
    currentLoad: null,
    isOnline: currentMetrics?.status === 'online' || !!currentMetrics
  }
}

// Hook untuk temperature metrics
export function useTemperatureMetrics(serverId?: string) {
  const { currentMetrics } = useMetrics(serverId)

  // Temperature data not available in current API, return empty
  const tempData = []

  return {
    data: tempData,
    currentTemp: null,
    isOnline: currentMetrics?.status === 'online' || !!currentMetrics
  }
}