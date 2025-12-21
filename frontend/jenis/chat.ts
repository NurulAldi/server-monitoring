// Type definitions untuk chat AI
export interface PesanChat {
  id: string
  pengirim: 'user' | 'ai'
  isi: string
  timestamp: string
  tipe?: 'text' | 'code' | 'error'
}

export interface RiwayatChat {
  id: string
  penggunaId: string
  judul?: string
  pesan: PesanChat[]
  dibuatPada: string
  diperbaruiPada: string
}

export interface DataKirimPesan {
  pesan: string
  konteks?: {
    serverId?: string
    alertId?: string
    metrikType?: string
  }
}

export interface ResponsAI {
  pesan: string
  tipe: 'text' | 'code' | 'error'
  rekomendasi?: string[]
  data?: any
}

export interface KonfigurasiChat {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}