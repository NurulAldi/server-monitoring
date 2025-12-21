'use client'

import { useState, useEffect, useCallback } from 'react'
import { layananServer } from '@/layanan/server'
import { logger } from '@/utilitas/logger'
import type { Server, StatusServer, MetrikServer } from '@/jenis/server'

export function useServer(serverId?: string) {
  const [servers, setServers] = useState<Server[]>([])
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [serverStatuses, setServerStatuses] = useState<StatusServer[]>([])
  const [serverMetrics, setServerMetrics] = useState<MetrikServer[]>([])
  const [sedangMemuat, setSedangMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all servers
  const fetchServers = useCallback(async () => {
    try {
      setSedangMemuat(true)
      setError(null)
      const data = await layananServer.getSemuaServer()
      setServers(data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.pesan || 'Gagal memuat server'
      setError(errorMessage)
      logger.error('Failed to fetch servers', err)
    } finally {
      setSedangMemuat(false)
    }
  }, [])

  // Fetch single server
  const fetchServer = useCallback(async (id: string) => {
    try {
      setSedangMemuat(true)
      setError(null)
      const data = await layananServer.getServerById(id)
      setCurrentServer(data)
      return data
    } catch (err: any) {
      const errorMessage = err.response?.data?.pesan || 'Gagal memuat server'
      setError(errorMessage)
      logger.error('Failed to fetch server', { id, error: err })
      throw err
    } finally {
      setSedangMemuat(false)
    }
  }, [])

  // Fetch server statuses
  const fetchServerStatuses = useCallback(async () => {
    try {
      const data = await layananServer.getStatusServer()
      setServerStatuses(data)
    } catch (err: any) {
      logger.error('Failed to fetch server statuses', err)
    }
  }, [])

  // Fetch server metrics
  const fetchServerMetrics = useCallback(async (id: string, filter?: any) => {
    try {
      const data = await layananServer.getMetrikServer(id, filter)
      setServerMetrics(data)
      return data
    } catch (err: any) {
      logger.error('Failed to fetch server metrics', { id, error: err })
      throw err
    }
  }, [])

  // Add new server
  const addServer = useCallback(async (serverData: any) => {
    try {
      setSedangMemuat(true)
      setError(null)
      const newServer = await layananServer.tambahServer(serverData)
      setServers(prev => [...prev, newServer])
      logger.userAction('add_server', { serverId: newServer.id })
      return newServer
    } catch (err: any) {
      const errorMessage = err.response?.data?.pesan || 'Gagal menambah server'
      setError(errorMessage)
      logger.error('Failed to add server', err)
      throw err
    } finally {
      setSedangMemuat(false)
    }
  }, [])

  // Update server
  const updateServer = useCallback(async (id: string, serverData: any) => {
    try {
      setSedangMemuat(true)
      setError(null)
      const updatedServer = await layananServer.updateServer({ id, ...serverData })
      setServers(prev => prev.map(s => s.id === id ? updatedServer : s))
      if (currentServer?.id === id) {
        setCurrentServer(updatedServer)
      }
      logger.userAction('update_server', { serverId: id })
      return updatedServer
    } catch (err: any) {
      const errorMessage = err.response?.data?.pesan || 'Gagal mengupdate server'
      setError(errorMessage)
      logger.error('Failed to update server', { id, error: err })
      throw err
    } finally {
      setSedangMemuat(false)
    }
  }, [currentServer])

  // Delete server
  const deleteServer = useCallback(async (id: string) => {
    try {
      setSedangMemuat(true)
      setError(null)
      await layananServer.hapusServer(id)
      setServers(prev => prev.filter(s => s.id !== id))
      if (currentServer?.id === id) {
        setCurrentServer(null)
      }
      logger.userAction('delete_server', { serverId: id })
    } catch (err: any) {
      const errorMessage = err.response?.data?.pesan || 'Gagal menghapus server'
      setError(errorMessage)
      logger.error('Failed to delete server', { id, error: err })
      throw err
    } finally {
      setSedangMemuat(false)
    }
  }, [currentServer])

  // Test server connection
  const testServerConnection = useCallback(async (id: string) => {
    try {
      const result = await layananServer.testKoneksiServer(id)
      logger.userAction('test_server_connection', { serverId: id, success: result.sukses })
      return result
    } catch (err: any) {
      logger.error('Server connection test failed', { id, error: err })
      throw err
    }
  }, [])

  // Load data on mount if serverId is provided
  useEffect(() => {
    if (serverId) {
      fetchServer(serverId)
      fetchServerMetrics(serverId)
    }
  }, [serverId, fetchServer, fetchServerMetrics])

  // Periodic status updates
  useEffect(() => {
    fetchServerStatuses()
    const interval = setInterval(fetchServerStatuses, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [fetchServerStatuses])

  return {
    // Data
    servers,
    currentServer,
    serverStatuses,
    serverMetrics,

    // State
    sedangMemuat,
    error,

    // Actions
    fetchServers,
    fetchServer,
    fetchServerStatuses,
    fetchServerMetrics,
    addServer,
    updateServer,
    deleteServer,
    testServerConnection,
  }
}