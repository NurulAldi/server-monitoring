import { Metadata } from 'next'
import DaftarAlertLengkap from '@/komponen/peringatan/DaftarAlertLengkap'

export const metadata: Metadata = {
  title: 'Daftar Alert - Dashboard Monitoring',
  description: 'Kelola dan pantau semua alert sistem',
}

export default function HalamanDaftarAlert() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Daftar Alert</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pantau dan kelola semua notifikasi alert sistem
        </p>
      </div>

      <DaftarAlertLengkap />
    </div>
  )
}