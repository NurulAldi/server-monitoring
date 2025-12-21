// Type definitions untuk alert
export interface Alert {
  id: string
  serverId: string
  serverNama: string
  jenis: string
  pesan: string
  tingkat: 'info' | 'peringatan' | 'kritis'
  status: 'aktif' | 'acknowledged' | 'resolved'
  threshold: number
  nilaiAktual: number
  kondisi: string
  durasi?: number
  acknowledgedOleh?: string
  acknowledgedPada?: string
  resolvedOleh?: string
  resolvedPada?: string
  dibuatPada: string
  diperbaruiPada: string
}

export interface RiwayatAlert {
  id: string
  alertId: string
  aksi: 'dibuat' | 'acknowledged' | 'resolved' | 'eskalasi'
  penggunaId?: string
  penggunaNama?: string
  catatan?: string
  timestamp: string
}

export interface AturanAlert {
  id: string
  nama: string
  deskripsi: string
  jenis: 'cpu' | 'memori' | 'disk' | 'uptime' | 'custom'
  kondisi: string
  threshold: number
  tingkat: 'info' | 'peringatan' | 'kritis'
  aktif: boolean
  serverIds: string[]
  interval: number
  cooldown: number
  notifikasi: {
    email: boolean
    sms: boolean
    push: boolean
  }
  dibuatPada: string
  diperbaruiPada: string
}

export interface DataTambahAlert {
  serverId: string
  jenis: string
  pesan: string
  tingkat: 'info' | 'peringatan' | 'kritis'
  threshold: number
  kondisi: string
}

export interface DataUpdateAlert {
  id: string
  status?: 'acknowledged' | 'resolved'
  catatan?: string
}

export interface StatistikAlert {
  total: number
  aktif: number
  acknowledged: number
  resolved: number
  kritis: number
  peringatan: number
  info: number
  rataRataResponTime: number
  rataRataResolveTime: number
}