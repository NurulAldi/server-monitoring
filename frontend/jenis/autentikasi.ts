// Type definitions untuk autentikasi
export interface Pengguna {
  id: string
  email: string // Only email for login and SMTP notifications
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

