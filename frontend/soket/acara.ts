// Konstanta untuk event Socket.IO
export const ACARA_SOKET = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',

  // Server monitoring events
  METRIK_UPDATE: 'metrik:update',
  SERVER_STATUS: 'server:status',
  SERVER_BARU: 'server:baru',
  SERVER_UPDATE: 'server:update',
  SERVER_HAPUS: 'server:hapus',

  // Alert events
  ALERT_BARU: 'alert:baru',
  ALERT_UPDATE: 'alert:update',
  ALERT_RESOLVE: 'alert:resolve',
  ALERT_ACKNOWLEDGE: 'alert:acknowledge',

  // Chat events
  CHAT_PESAN: 'chat:pesan',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_TYPING: 'chat:typing',

  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_USERS: 'room:users',

  // Notification events
  NOTIFIKASI_BARU: 'notifikasi:baru',
  NOTIFIKASI_BACA: 'notifikasi:baca',
} as const

// Type untuk event data
export interface DataMetrikUpdate {
  serverId: string
  metrik: {
    cpu: number
    memori: number
    disk: number
    uptime: number
    timestamp: string
  }
}

export interface DataAlertBaru {
  alertId: string
  serverId: string
  serverNama: string
  jenis: string
  pesan: string
  tingkat: 'info' | 'peringatan' | 'kritis'
  timestamp: string
}

export interface DataServerStatus {
  serverId: string
  status: 'online' | 'offline' | 'maintenance' | 'warning'
  timestamp: string
}

export interface DataChatPesan {
  pesanId: string
  penggunaId: string
  penggunaNama: string
  isi: string
  timestamp: string
  tipe?: 'text' | 'code' | 'error'
}

export interface DataRoomJoin {
  room: string
  pengguna: {
    id: string
    nama: string
  }
}

export interface DataNotifikasiBaru {
  id: string
  judul: string
  pesan: string
  tipe: 'info' | 'peringatan' | 'error' | 'success'
  timestamp: string
  dibaca: boolean
}