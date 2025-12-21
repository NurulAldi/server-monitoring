// Validator input umum
export const validatorInput = {
  // Validasi email
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  // Validasi IP address
  ipAddress: (ip: string): boolean => {
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!regex.test(ip)) return false

    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  },

  // Validasi port
  port: (port: number): boolean => {
    return port >= 1 && port <= 65535
  },

  // Validasi persentase
  persentase: (value: number): boolean => {
    return value >= 0 && value <= 100
  },

  // Validasi nama (tidak kosong, minimal panjang)
  nama: (nama: string, minLength: number = 2): boolean => {
    return nama.trim().length >= minLength
  },

  // Validasi kata sandi
  kataSandi: (password: string, minLength: number = 6): boolean => {
    return password.length >= minLength
  },

  // Validasi URL
  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  // Validasi tanggal (YYYY-MM-DD)
  tanggal: (tanggal: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(tanggal)) return false

    const date = new Date(tanggal)
    return date.toISOString().slice(0, 10) === tanggal
  },

  // Validasi nomor positif
  nomorPositif: (num: number): boolean => {
    return num > 0 && Number.isFinite(num)
  },

  // Validasi string tidak kosong
  tidakKosong: (str: string): boolean => {
    return str.trim().length > 0
  },
}