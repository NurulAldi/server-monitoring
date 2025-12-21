import { Metadata } from 'next'
import TabelServer from '@/komponen/umum/TabelServer'
import FormulirTambahServer from '@/komponen/formulir/FormulirTambahServer'

export const metadata: Metadata = {
  title: 'Manajemen Server - Admin',
  description: 'Panel admin untuk manajemen server monitoring',
}

export default function HalamanAdminServer() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Server</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola server yang dipantau dalam sistem
          </p>
        </div>

        <div className="space-y-6">
          {/* Formulir Tambah Server */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tambah Server Baru
            </h2>
            <FormulirTambahServer />
          </div>

          {/* Tabel Server */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Daftar Server
            </h2>
            <TabelServer />
          </div>
        </div>
      </div>
    </div>
  )
}