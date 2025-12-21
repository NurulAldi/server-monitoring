'use client'

import { useEffect, useRef, useCallback } from 'react'
import { soketClient } from '@/soket/indeks'
import { autentikasiSoket } from '@/soket/autentikasi'
import { manajerRuang } from '@/soket/ruang'
import { logger } from '@/utilitas/logger'
import type { DataMetrikUpdate, DataAlertBaru, DataServerStatus, DataChatPesan } from '@/soket/acara'

export function useSocket() {
  const socketRef = useRef(soketClient.connect())

  useEffect(() => {
    // Setup authentication and room listeners
    autentikasiSoket.setupAuthListeners()
    manajerRuang.setupRoomListeners()

    return () => {
      // Cleanup on unmount
      manajerRuang.leaveSemuaRuang()
    }
  }, [])

  const connect = useCallback(() => {
    socketRef.current = soketClient.connect()
    return socketRef.current
  }, [])

  const disconnect = useCallback(() => {
    soketClient.disconnect()
  }, [])

  const authenticate = useCallback((token: string, userId: string) => {
    autentikasiSoket.setToken(token)
    autentikasiSoket.setUserId(userId)
    return autentikasiSoket.authenticate()
  }, [])

  const deauthenticate = useCallback(() => {
    autentikasiSoket.deauthenticate()
  }, [])

  // Room management
  const joinRoom = useCallback((room: string) => {
    manajerRuang.joinRuang(room)
  }, [])

  const leaveRoom = useCallback((room: string) => {
    manajerRuang.leaveRuang(room)
  }, [])

  const joinDashboard = useCallback(() => {
    manajerRuang.joinRuangDashboard()
  }, [])

  const joinServer = useCallback((serverId: string) => {
    manajerRuang.joinRuangServer(serverId)
  }, [])

  const joinAlert = useCallback((alertId: string) => {
    manajerRuang.joinRuangAlert(alertId)
  }, [])

  // Event listeners
  const onMetrikUpdate = useCallback((callback: (data: DataMetrikUpdate) => void) => {
    socketRef.current.on('metrik:update', callback)
    logger.socketEvent('metrik:update', 'listener added')
  }, [])

  const onAlertBaru = useCallback((callback: (data: DataAlertBaru) => void) => {
    socketRef.current.on('alert:baru', callback)
    logger.socketEvent('alert:baru', 'listener added')
  }, [])

  const onServerStatus = useCallback((callback: (data: DataServerStatus) => void) => {
    socketRef.current.on('server:status', callback)
    logger.socketEvent('server:status', 'listener added')
  }, [])

  const onChatPesan = useCallback((callback: (data: DataChatPesan) => void) => {
    socketRef.current.on('chat:pesan', callback)
    logger.socketEvent('chat:pesan', 'listener added')
  }, [])

  // Emit events
  const sendChatMessage = useCallback((data: any) => {
    soketClient.emitChatPesan(data)
    logger.socketEvent('chat:send', data)
  }, [])

  return {
    // Connection
    connect,
    disconnect,
    isConnected: soketClient.isConnected,
    socketId: soketClient.id,

    // Authentication
    authenticate,
    deauthenticate,
    isAuthenticated: autentikasiSoket.isAuthenticated(),

    // Rooms
    joinRoom,
    leaveRoom,
    joinDashboard,
    joinServer,
    joinAlert,
    activeRooms: manajerRuang.getRuangAktif(),

    // Event listeners
    onMetrikUpdate,
    onAlertBaru,
    onServerStatus,
    onChatPesan,

    // Emit events
    sendChatMessage,
  }
}