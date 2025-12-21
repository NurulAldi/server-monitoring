// Manajemen ruang (rooms) untuk Socket.IO
import { soketClient } from './indeks'
import { logger } from '@/utilitas/logger'

export class ManajerRuang {
  private ruangAktif: Set<string> = new Set()

  joinRuang(ruang: string) {
    if (this.ruangAktif.has(ruang)) {
      logger.debug('Already in room', { ruang })
      return
    }

    soketClient.emitJoinRoom(ruang)
    this.ruangAktif.add(ruang)
    logger.info('Joined room', { ruang })
  }

  leaveRuang(ruang: string) {
    if (!this.ruangAktif.has(ruang)) {
      logger.debug('Not in room', { ruang })
      return
    }

    soketClient.emitLeaveRoom(ruang)
    this.ruangAktif.delete(ruang)
    logger.info('Left room', { ruang })
  }

  leaveSemuaRuang() {
    this.ruangAktif.forEach(ruang => {
      this.leaveRuang(ruang)
    })
    this.ruangAktif.clear()
    logger.info('Left all rooms')
  }

  getRuangAktif(): string[] {
    return Array.from(this.ruangAktif)
  }

  isInRuang(ruang: string): boolean {
    return this.ruangAktif.has(ruang)
  }

  // Ruang khusus untuk fitur tertentu
  joinRuangDashboard() {
    this.joinRuang('dashboard')
  }

  joinRuangServer(serverId: string) {
    this.joinRuang(`server:${serverId}`)
  }

  joinRuangAlert(alertId: string) {
    this.joinRuang(`alert:${alertId}`)
  }

  joinRuangChat(chatId: string) {
    this.joinRuang(`chat:${chatId}`)
  }

  leaveRuangServer(serverId: string) {
    this.leaveRuang(`server:${serverId}`)
  }

  leaveRuangAlert(alertId: string) {
    this.leaveRuang(`alert:${alertId}`)
  }

  leaveRuangChat(chatId: string) {
    this.leaveRuang(`chat:${chatId}`)
  }

  // Setup room event listeners
  setupRoomListeners() {
    const socket = soketClient.connect()

    socket.on('room:joined', (data: { room: string; success: boolean }) => {
      if (data.success) {
        logger.debug('Successfully joined room', { room: data.room })
      } else {
        logger.warn('Failed to join room', { room: data.room })
        this.ruangAktif.delete(data.room)
      }
    })

    socket.on('room:left', (data: { room: string; success: boolean }) => {
      if (data.success) {
        logger.debug('Successfully left room', { room: data.room })
      }
    })

    socket.on('room:users', (data: { room: string; users: any[] }) => {
      logger.debug('Room users updated', { room: data.room, userCount: data.users.length })
    })
  }
}

// Export singleton instance
export const manajerRuang = new ManajerRuang()