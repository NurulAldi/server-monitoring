'use client'

import Link from 'next/link'
import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'
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
        return 'text-red-600 bg-red-100'
      case 'peringatan':
        return 'text-yellow-600 bg-yellow-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-4">
      {dataAlert.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Tidak ada alert aktif</p>
        </div>
      ) : (
        dataAlert.map((alert) => (
          <Kartu key={alert.id}>
            <KontenKartu>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {alert.jenis}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Server: {alert.server}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{alert.pesan}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTingkatColor(
                      alert.tingkat
                    )}`}
                  >
                    {alert.tingkat.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{alert.waktu}</span>
                  <Link href={`/dashboard/peringatan/${alert.id}`}>
                    <Tombol variant="outline" size="sm">
                      Detail
                    </Tombol>
                  </Link>
                </div>
              </div>
            </KontenKartu>
          </Kartu>
        ))
      )}
    </div>
  )
}