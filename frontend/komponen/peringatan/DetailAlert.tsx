'use client'

import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'
import { Tombol } from '@/komponen/umum/Tombol'

interface PropsDetailAlert {
  idAlert: string
}

export default function DetailAlert({ idAlert }: PropsDetailAlert) {
  // TODO: Fetch data alert berdasarkan ID
  const dataAlert = {
    id: idAlert,
    server: 'API Server',
    jenis: 'CPU Usage High',
    pesan: 'Penggunaan CPU melebihi 90% selama 5 menit terakhir',
    tingkat: 'kritis',
    status: 'aktif',
    waktuTerjadi: '2024-01-15 14:30:00',
    waktuDiselesaikan: null,
    threshold: '90%',
    nilaiAktual: '92.5%',
    durasi: '5 menit',
    rekomendasi: 'Periksa proses yang menggunakan CPU tinggi dan restart jika diperlukan',
  }

  const getTingkatColor = (tingkat: string) => {
    switch (tingkat) {
      case 'kritis':
        return 'text-accent-red bg-accent-red/10'
      case 'Peringatan':
        return 'text-warning-amber bg-warning-amber/10'
      case 'Info':
        return 'text-accent-blue bg-accent-blue/10'
      default:
        return 'text-neutral-400 bg-neutral-800'
    }
  }

  return (
    <Kartu>
      <HeaderKartu>
        <JudulKartu>Detail Alert: {dataAlert.jenis}</JudulKartu>
      </HeaderKartu>
      <KontenKartu>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Server</h4>
            <p className="text-sm">{dataAlert.server}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Tingkat</h4>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTingkatColor(
                dataAlert.tingkat
              )}`}
            >
              {dataAlert.tingkat.toUpperCase()}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                dataAlert.status === 'aktif'
                  ? 'text-red-600 bg-red-100'
                  : 'text-green-600 bg-green-100'
              }`}
            >
              {dataAlert.status.toUpperCase()}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Waktu Terjadi</h4>
            <p className="text-sm">{dataAlert.waktuTerjadi}</p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Pesan</h4>
            <p className="text-sm">{dataAlert.pesan}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Threshold</h4>
            <p className="text-sm">{dataAlert.threshold}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Nilai Aktual</h4>
            <p className="text-sm">{dataAlert.nilaiAktual}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Durasi</h4>
            <p className="text-sm">{dataAlert.durasi}</p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Rekomendasi</h4>
            <p className="text-sm">{dataAlert.rekomendasi}</p>
          </div>
        </div>

        {dataAlert.status === 'aktif' && (
          <div className="mt-6 flex space-x-4">
            <Tombol variant="outline">Acknowledge</Tombol>
            <Tombol variant="destructive">Resolve</Tombol>
          </div>
        )}
      </KontenKartu>
    </Kartu>
  )
}