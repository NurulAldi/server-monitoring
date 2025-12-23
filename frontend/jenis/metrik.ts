// Type definitions untuk metrik - SIMPLIFIED: 4 Core Metrics Only
export interface MetrikDasar {
  cpu: number
  ram: number
  disk: number
  temperature: number
  timestamp: string
}

export interface MetrikDetail extends MetrikDasar {
  cpuCore?: number
  ramTotal?: number
  ramUsed?: number
  diskTotal?: number
  diskUsed?: number
}

export interface MetrikAgregat {
  serverId: string
  periode: 'jam' | 'hari' | 'minggu' | 'bulan'
  timestamp: string
  cpuRataRata: number
  cpuMaksimal: number
  cpuMinimal: number
  ramRataRata: number
  ramMaksimal: number
  ramMinimal: number
  diskRataRata: number
  diskMaksimal: number
  diskMinimal: number
  temperatureRataRata: number
  temperatureMaksimal: number
  temperatureMinimal: number
  totalDataPoint: number
}

export interface TrendMetrik {
  serverId: string
  metrik: 'cpu' | 'ram' | 'disk' | 'temperature'
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
  metrik: 'cpu' | 'ram' | 'disk' | 'temperature'
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