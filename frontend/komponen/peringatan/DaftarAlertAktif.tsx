'use client'

import Link from 'next/link'
import { Tombol } from '@/komponen/umum/Tombol'

interface Alert {
  id: string
  server: string
  jenis: string
  pesan: string
  tingkat: 'kritis' | 'peringatan' | 'info'
  waktu: string
}

export default function DaftarAlertAktif() {
  // TODO: Fetch data dari API
  const dataAlert: Alert[] = [
    {
      id: 'alert-1',
      server: 'API Server',
      jenis: 'CPU Usage',
      pesan: 'Penggunaan CPU melebihi 90%',
      tingkat: 'kritis',
      waktu: '2 menit yang lalu',
    },
    {
      id: 'alert-2',
      server: 'Database Server',
      jenis: 'Memory Usage',
      pesan: 'Penggunaan memori melebihi 85%',
      tingkat: 'peringatan',
      waktu: '15 menit yang lalu',
    },
  ]

  const getTingkatColor = (tingkat: string) => {
    switch (tingkat) {
      case 'kritis':
        return 'text-red-700 bg-red-100 border border-red-300'
      case 'peringatan':
        return 'text-amber-700 bg-amber-100 border border-amber-300'
      case 'info':
        return 'text-blue-700 bg-blue-100 border border-blue-300'
      default:
        return 'text-slate-600 bg-slate-100 border border-slate-300'
    }
  }

  return (
    <div className="space-y-4">
      {dataAlert.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">Tidak ada alert aktif</p>
        </div>
      ) : (
        dataAlert.map((alert) => (
          <div
            key={alert.id}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Alert Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    {alert.jenis}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getTingkatColor(
                      alert.tingkat
                    )}`}
                  >
                    {alert.tingkat.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Server: {alert.server}
                </p>
                <p className="text-sm text-slate-700">{alert.pesan}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-slate-500">{alert.waktu}</span>
                  <Tombol variant="outline" size="sm">
                    Detail
                  </Tombol>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}