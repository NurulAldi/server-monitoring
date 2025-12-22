// Type definitions untuk autentikasi
export interface Pengguna {
  id: string
  nama: string
  email: string // Used for SMTP notification system
  avatar?: string
  terakhirLogin?: string
  status: 'aktif' | 'nonaktif'
  dibuatPada: string
  diperbaruiPada: string
}

export interface TokenAuth {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

export interface DataLogin {
  email: string
  kataSandi: string
}

export interface DataRegister {
  nama: string
  email: string
  kataSandi: string
  konfirmasiKataSandi: string
}

export interface ResponsLogin {
  pengguna: Pengguna
  token: TokenAuth
}

export interface ResponsRegister {
  pengguna: Pengguna
  pesan: string
}

export interface DataResetPassword {
  email: string
}

export interface DataUbahPassword {
  kataSandiLama: string
  kataSandiBaru: string
  konfirmasiKataSandi: string
}