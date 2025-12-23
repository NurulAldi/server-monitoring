'use client'

import Link from 'next/link'
import { Kartu, HeaderKartu, JudulKartu, KontenKartu, FooterKartu } from '@/komponen/umum/Kartu'
import { formatDistanceToNow } from 'date-fns'
import { Tombol } from '@/komponen/umum/Tombol'

interface AlertProps {
  id: string
  pesan: string
  server: { id?: string; nama: string }
  tingkat: 'kritis' | 'peringatan' | 'info' | string
  status: 'aktif' | 'ditangani' | 'ditutup' | string
  waktu?: string | Date
}

export function KartuAlert({ alert }: { alert: AlertProps }) {
  const getTingkatColor = (tingkat: string) => {
    switch (tingkat) {
      case 'kritis':
        return 'text-red-600 bg-red-100'
      case 'peringatan':
        return 'text-amber-600 bg-amber-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'aktif') return 'text-red-600 bg-red-100'
    if (status === 'ditangani') return 'text-yellow-700 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const waktuText = () => {
    if (!alert.waktu) return ''
    try {
      const d = typeof alert.waktu === 'string' ? new Date(alert.waktu) : alert.waktu
      return formatDistanceToNow(d, { addSuffix: true })
    } catch (e) {
      return String(alert.waktu)
    }
  }

  return (
    <Kartu>
      <HeaderKartu>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <JudulKartu>{alert.pesan}</JudulKartu>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${getTingkatColor(alert.tingkat)}`}>
              {alert.tingkat?.toUpperCase()}
            </span>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(alert.status)}`}>
              {alert.status?.toUpperCase()}
            </div>
          </div>
        </div>
      </HeaderKartu>

      <KontenKartu>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm text-gray-500">Server</h4>
            <p className="text-sm text-slate-700">{alert.server?.nama || '-'}</p>
          </div>

          <div>
            <h4 className="text-sm text-gray-500">Pesan</h4>
            <p className="text-sm text-slate-700 line-clamp-2">{alert.pesan}</p>
          </div>

          <div className="text-right">
            <h4 className="text-sm text-gray-500">Waktu</h4>
            <p className="text-sm text-slate-700">{waktuText()}</p>
          </div>
        </div>
      </KontenKartu>

      <FooterKartu>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">{alert.server?.nama}</div>
          <div className="flex items-center gap-2">
            <div>
              <Tombol size="sm" variant="outline">Detail</Tombol>
            </div>
          </div>
        </div>
      </FooterKartu>
    </Kartu>
  )
}
