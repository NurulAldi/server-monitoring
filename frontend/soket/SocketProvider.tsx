'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/kait/AutentikasiProvider'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  reconnectAttempts: number
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback?: (...args: any[]) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const { user, token, isAuthenticated } = useAuth()

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if user is not authenticated
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Create socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: token
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
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
      setConnectionError(null)
      setReconnectAttempts(0)

      // Join user-specific room
      if (user?.id) {
        newSocket.emit('join:user', user.id)
      }

      // Join role-based room
      if (user?.role) {
        newSocket.emit('join:role', user.role)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)

      if (reason === 'io server disconnect') {
        // Server disconnected, manual reconnection needed
        setConnectionError('Server disconnected')
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnectionError(error.message)
      setReconnectAttempts(prev => prev + 1)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setConnectionError(null)
      setReconnectAttempts(0)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection failed:', error)
      setConnectionError(`Reconnection failed: ${error.message}`)
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed permanently')
      setConnectionError('Failed to reconnect to server')
    })

    setSocket(newSocket)

    // Cleanup on unmount or dependency change
    return () => {
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated, token, user?.id, user?.role])

  // Socket methods
  const joinRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('join:room', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('leave:room', room)
    }
  }

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}