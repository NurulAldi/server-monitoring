// Autentikasi untuk Socket.IO
import { soketClient } from './indeks'
import { logger } from '@/utilitas/logger'

export class AutentikasiSoket {
  private token: string | null = null
  private userId: string | null = null

  setToken(token: string) {
    this.token = token
    logger.debug('Socket auth token set')
  }

  setUserId(userId: string) {
    this.userId = userId
    logger.debug('Socket user ID set', { userId })
  }

  authenticate() {
    if (!this.token || !this.userId) {
      logger.warn('Socket authentication failed: missing token or userId')
      return false
    }

    // Emit authentication event
    soketClient.connect().emit('authenticate', {
      token: this.token,
      userId: this.userId,
    })

    logger.info('Socket authentication initiated')
    return true
  }

  deauthenticate() {
    this.token = null
    this.userId = null
    soketClient.disconnect()
    logger.info('Socket deauthenticated')
  }

  isAuthenticated(): boolean {
    return soketClient.isConnected && !!this.token && !!this.userId
  }

  // Setup authentication listeners
  setupAuthListeners() {
    const socket = soketClient.connect()

    socket.on('authenticated', (data: { success: boolean; user?: any }) => {
      if (data.success) {
        logger.info('Socket authenticated successfully', { user: data.user })
      } else {
        logger.error('Socket authentication failed')
      }
    })

    socket.on('unauthorized', (data: { message: string }) => {
      logger.warn('Socket unauthorized', { message: data.message })
      this.deauthenticate()
    })
  }
}

// Export singleton instance
export const autentikasiSoket = new AutentikasiSoket()