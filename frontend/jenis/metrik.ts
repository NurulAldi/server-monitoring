// Type definitions untuk metrik
export interface MetrikDasar {
  cpu: number
  memori: number
  disk: number
  uptime: number
  timestamp: string
}

export interface MetrikDetail extends MetrikDasar {
  cpuCore: number[]
  memoriTotal: number
  memoriDigunakan: number
  diskTotal: number
  diskDigunakan: number
  jaringanRx: number
  jaringanTx: number
  proses: number
  loadAverage: number[]
}

export interface MetrikAgregat {
  serverId: string
  periode: 'jam' | 'hari' | 'minggu' | 'bulan'
  timestamp: string
  cpuRataRata: number
  cpuMaksimal: number
  cpuMinimal: number
  memoriRataRata: number
  memoriMaksimal: number
  memoriMinimal: number
  diskRataRata: number
  diskMaksimal: number
  diskMinimal: number
  uptimeRataRata: number
  totalDataPoint: number
}

export interface TrendMetrik {
  serverId: string
  metrik: 'cpu' | 'memori' | 'disk' | 'uptime'
  periode: '1h' | '24h' | '7d' | '30d'
  data: {
    timestamp: string
    nilai: number
  }[]
  trend: 'naik' | 'turun' | 'stabil'
  perubahanPersen: number
}

export interface BaselineMetrik {
  serverId: string
  metrik: 'cpu' | 'memori' | 'disk'
  baseline: {
    rataRata: number
    standarDeviasi: number
    maksimal: number
    minimal: number
  }
  periodePelatihan: {
    mulai: string
    akhir: string
  }
  diperbaruiPada: string
}

export interface DataFilterMetrik {
  serverId?: string
  mulaiTanggal?: string
  akhirTanggal?: string
  interval?: '1m' | '5m' | '15m' | '1h' | '1d'
  limit?: number
}