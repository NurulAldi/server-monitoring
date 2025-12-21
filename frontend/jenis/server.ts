// Type definitions untuk server
export interface Server {
  id: string
  nama: string
  ip: string
  port?: number
  lokasi: string
  deskripsi?: string
  status: 'online' | 'offline' | 'maintenance' | 'warning'
  os?: string
  dibuatPada: string
  diperbaruiPada: string
  terakhirOnline?: string
}

export interface MetrikServer {
  id: string
  serverId: string
  timestamp: string
  cpu: {
    penggunaan: number
    core: number
    frekuensi: number
  }
  memori: {
    total: number
    digunakan: number
    persen: number
  }
  disk: {
    total: number
    digunakan: number
    persen: number
  }
  jaringan: {
    upload: number
    download: number
  }
  uptime: number
}

export interface StatusServer {
  id: string
  nama: string
  status: 'online' | 'offline' | 'maintenance' | 'warning'
  metrikTerakhir?: MetrikServer
  alertAktif: number
  uptime: number
  responseTime?: number
}

export interface DataTambahServer {
  nama: string
  ip: string
  port?: number
  lokasi: string
  deskripsi?: string
}

export interface DataUpdateServer extends Partial<DataTambahServer> {
  id: string
}