import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

// Formatter tanggal dalam bahasa Indonesia
export const formatterTanggal = {
  // Format lengkap: "Senin, 15 Januari 2024 14:30:00"
  formatLengkap: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return format(date, "EEEE, dd MMMM yyyy HH:mm:ss", { locale: id })
  },

  // Format pendek: "15 Jan 2024 14:30"
  formatPendek: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return format(date, "dd MMM yyyy HH:mm", { locale: id })
  },

  // Format tanggal saja: "15 Januari 2024"
  formatTanggal: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return format(date, "dd MMMM yyyy", { locale: id })
  },

  // Format waktu saja: "14:30:00"
  formatWaktu: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return format(date, "HH:mm:ss")
  },

  // Format relatif: "2 menit yang lalu"
  formatRelatif: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return formatDistanceToNow(date, { addSuffix: true, locale: id })
  },

  // Format untuk input date: "2024-01-15"
  formatUntukInput: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return format(date, "yyyy-MM-dd")
  },

  // Format untuk filename: "2024-01-15_14-30-00"
  formatUntukFile: (tanggal: string | Date): string => {
    const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal
    return format(date, "yyyy-MM-dd_HH-mm-ss")
  },

  // Format uptime: mengkonversi detik ke format readable
  formatUptime: (detik: number): string => {
    const hari = Math.floor(detik / 86400)
    const jam = Math.floor((detik % 86400) / 3600)
    const menit = Math.floor((detik % 3600) / 60)

    const parts = []
    if (hari > 0) parts.push(`${hari}d`)
    if (jam > 0) parts.push(`${jam}h`)
    if (menit > 0) parts.push(`${menit}m`)

    return parts.join(' ') || '0m'
  },

  // Format durasi: mengkonversi detik ke format readable
  formatDurasi: (detik: number): string => {
    if (detik < 60) return `${detik} detik`
    if (detik < 3600) return `${Math.floor(detik / 60)} menit`
    if (detik < 86400) return `${Math.floor(detik / 3600)} jam`
    return `${Math.floor(detik / 86400)} hari`
  },
}