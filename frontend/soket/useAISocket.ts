'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/kait/AutentikasiProvider'

interface AISocketContextType {
  aiSocket: Socket | null
  isAIConnected: boolean
  aiConnectionError: string | null
  emitAI: (event: string, data?: any) => void
  onAI: (event: string, callback: (...args: any[]) => void) => void
  offAI: (event: string, callback?: (...args: any[]) => void) => void
}

export function useAISocket(): AISocketContextType {
  const [aiSocket, setAISocket] = useState<Socket | null>(null)
  const [isAIConnected, setIsAIConnected] = useState(false)
  const [aiConnectionError, setAIConnectionError] = useState<string | null>(null)

  const { user, token, isAuthenticated } = useAuth()

  // Initialize AI socket connection to /ai namespace
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
      // Disconnect if user is not authenticated
      if (aiSocket) {
        aiSocket.disconnect()
        setAISocket(null)
        setIsAIConnected(false)
      }
      return
    }

    // Create AI socket connection to /ai namespace
    const newAISocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001'}/ai`, {
      auth: {
        token: token,
        userId: user.id
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    })

    // Connection event handlers
    newAISocket.on('connect', () => {
      console.log('AI Socket connected:', newAISocket.id)
      setIsAIConnected(true)
      setAIConnectionError(null)

      // Join user-specific AI room
      newAISocket.emit('ai:session:start', {
        userId: user.id,
        timestamp: new Date().toISOString()
      })
    })

    newAISocket.on('disconnect', (reason) => {
      console.log('AI Socket disconnected:', reason)
      setIsAIConnected(false)

      if (reason === 'io server disconnect') {
        setAIConnectionError('AI server disconnected')
      }
    })

    newAISocket.on('connect_error', (error) => {
      console.error('AI Socket connection error:', error)
      setAIConnectionError(error.message)
    })

    newAISocket.on('reconnect', () => {
      console.log('AI Socket reconnected')
      setIsAIConnected(true)
      setAIConnectionError(null)
    })

    newAISocket.on('reconnect_error', (error) => {
      console.error('AI Socket reconnection failed:', error)
      setAIConnectionError(`AI reconnection failed: ${error.message}`)
    })

    newAISocket.on('reconnect_failed', () => {
      console.error('AI Socket reconnection failed permanently')
      setAIConnectionError('Failed to reconnect to AI server')
    })

    setAISocket(newAISocket)

    // Cleanup on unmount or dependency change
    return () => {
      newAISocket.disconnect()
      setAISocket(null)
      setIsAIConnected(false)
    }
  }, [isAuthenticated, token, user?.id])

  // AI Socket methods
  const emitAI = (event: string, data?: any) => {
    if (aiSocket && isAIConnected) {
      aiSocket.emit(event, data)
    } else {
      console.warn('AI Socket not connected, cannot emit:', event)
    }
  }

  const onAI = (event: string, callback: (...args: any[]) => void) => {
    if (aiSocket) {
      aiSocket.on(event, callback)
    }
  }

  const offAI = (event: string, callback?: (...args: any[]) => void) => {
    if (aiSocket) {
      if (callback) {
        aiSocket.off(event, callback)
      } else {
        aiSocket.off(event)
      }
    }
  }

  return {
    aiSocket,
    isAIConnected,
    aiConnectionError,
    emitAI,
    onAI,
    offAI
  }
}