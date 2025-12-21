import { Metadata } from 'next'
import DaftarServerLengkap from '@/komponen/pemantauan/DaftarServerLengkap'

export const metadata: Metadata = {
  title: 'Daftar Server - Dashboard Monitoring',
  description: 'Kelola dan pantau semua server yang terdaftar',
}

export default function HalamanDaftarServer() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Daftar Server</h1>
        <p className="mt-2 text-sm text-gray-600">
          Kelola dan pantau kesehatan semua server Anda
        </p>
      </div>

      <DaftarServerLengkap />
    </div>
  )
}