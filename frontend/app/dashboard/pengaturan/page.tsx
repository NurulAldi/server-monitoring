import { Metadata } from 'next'
import PengaturanProfil from '@/komponen/formulir/PengaturanProfil'
import PengaturanNotifikasi from '@/komponen/formulir/PengaturanNotifikasi'
import PengaturanServer from '@/komponen/formulir/PengaturanServer'

export const metadata: Metadata = {
  title: 'Pengaturan - Dashboard Monitoring',
  description: 'Konfigurasi pengaturan dashboard monitoring',
}

export default function HalamanPengaturan() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola pengaturan akun dan preferensi monitoring
          </p>
        </div>

        <div className="space-y-6">
          {/* Pengaturan Profil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profil Pengguna
            </h2>
            <PengaturanProfil />
          </div>

          {/* Pengaturan Notifikasi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Notifikasi
            </h2>
            <PengaturanNotifikasi />
          </div>

          {/* Pengaturan Server */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Konfigurasi Server
            </h2>
            <PengaturanServer />
          </div>
        </div>
      </div>
    </div>
  )
}