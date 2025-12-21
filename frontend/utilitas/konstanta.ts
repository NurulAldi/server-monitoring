// Konstanta aplikasi
export const KONSTANTA = {
  NAMA_APLIKASI: 'Dashboard Monitoring Server',
  VERSI: '1.0.0',
  DESKRIPSI: 'Sistem monitoring kesehatan server real-time',

  // API
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',

  // Interval monitoring (dalam detik)
  INTERVAL_MONITORING: 60,

  // Threshold default
  THRESHOLD_CPU: 90,
  THRESHOLD_MEMORI: 85,
  THRESHOLD_DISK: 95,

  // Status server
  STATUS_SERVER: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    MAINTENANCE: 'maintenance',
    WARNING: 'warning',
  },

  // Tingkat alert
  TINGKAT_ALERT: {
    INFO: 'info',
    PERINGATAN: 'peringatan',
    KRITIS: 'kritis',
  },

  // Event Socket.IO
  EVENT_SOCKET: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    METRIK_UPDATE: 'metrik:update',
    ALERT_BARU: 'alert:baru',
    SERVER_STATUS: 'server:status',
    CHAT_PESAN: 'chat:pesan',
  },

  // Route paths
  ROUTE: {
    DASHBOARD: '/dashboard',
    PEMANTAUAN: '/dashboard/pemantauan',
    PERINGATAN: '/dashboard/peringatan',
    OBROLAN: '/dashboard/obrolan',
    PENGATURAN: '/dashboard/pengaturan',
    AUTENTIKASI: '/autentikasi',
    ADMIN: '/admin',
  },
} as const