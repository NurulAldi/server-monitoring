'use client'

import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'

interface PropsRiwayatAlert {
  idAlert: string
}

interface AlertRiwayat {
  id: string
  waktu: string
  aksi: string
  pengguna: string
  catatan?: string
}

export default function RiwayatAlert({ idAlert }: PropsRiwayatAlert) {
  // TODO: Fetch riwayat alert berdasarkan ID alert
  const dataRiwayat: AlertRiwayat[] = [
    {
      id: 'hist-1',
      waktu: '2024-01-15 14:30:00',
      aksi: 'Alert Terjadi',
      pengguna: 'System',
      catatan: 'CPU usage exceeded 90%',
    },
    {
      id: 'hist-2',
      waktu: '2024-01-15 14:35:00',
      aksi: 'Acknowledged',
      pengguna: 'admin@example.com',
      catatan: 'Alert diakui, sedang diperiksa',
    },
  ]

  return (
    <Kartu>
      <HeaderKartu>
        <JudulKartu>Riwayat Alert</JudulKartu>
      </HeaderKartu>
      <KontenKartu>
        <div className="space-y-4">
          {dataRiwayat.map((riwayat) => (
            <div key={riwayat.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {riwayat.aksi}
                  </p>
                  <p className="text-sm text-gray-500">{riwayat.waktu}</p>
                </div>
                <p className="text-sm text-gray-600">Oleh: {riwayat.pengguna}</p>
                {riwayat.catatan && (
                  <p className="text-sm text-gray-500 mt-1">{riwayat.catatan}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </KontenKartu>
    </Kartu>
  )
}