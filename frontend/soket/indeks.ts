import { io, Socket } from 'socket.io-client'
import { KONSTANTA } from '@/utilitas/konstanta'
import { logger } from '@/utilitas/logger'

class SoketClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(KONSTANTA.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true,
    })

    this.setupEventListeners()
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      logger.info('Socket disconnected')
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      logger.info('Socket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected', { reason })
    })

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error', error)
      this.handleReconnect()
    })

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info('Socket reconnected', { attemptNumber })
    })

    this.socket.on('reconnect_error', (error) => {
      logger.error('Socket reconnection error', error)
    })

    this.socket.on('reconnect_failed', () => {
      logger.error('Socket reconnection failed')
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          this.socket.connect()
        }
      }, delay)
    }
  }

  // Event listeners untuk fitur monitoring
  onMetrikUpdate(callback: (data: any) => void) {
    this.socket?.on(KONSTANTA.EVENT_SOCKET.METRIK_UPDATE, callback)
  }

  onAlertBaru(callback: (data: any) => void) {
    this.socket?.on(KONSTANTA.EVENT_SOCKET.ALERT_BARU, callback)
  }

  onServerStatus(callback: (data: any) => void) {
    this.socket?.on(KONSTANTA.EVENT_SOCKET.SERVER_STATUS, callback)
  }

  onChatPesan(callback: (data: any) => void) {
    this.socket?.on(KONSTANTA.EVENT_SOCKET.CHAT_PESAN, callback)
  }

  // Emit events
  emitChatPesan(data: any) {
    this.socket?.emit('chat:send', data)
  }

  emitJoinRoom(room: string) {
    this.socket?.emit('room:join', { room })
  }

  emitLeaveRoom(room: string) {
    this.socket?.emit('room:leave', { room })
  }

  // Utility methods
  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  get id(): string | undefined {
    return this.socket?.id
  }
}

// Export singleton instance
export const soketClient = new SoketClient()