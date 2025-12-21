import { Metadata } from 'next'
import TabelPengguna from '@/komponen/umum/TabelPengguna'
import FormulirTambahPengguna from '@/komponen/formulir/FormulirTambahPengguna'

export const metadata: Metadata = {
  title: 'Manajemen Pengguna - Admin',
  description: 'Panel admin untuk manajemen pengguna sistem monitoring',
}

export default function HalamanAdminPengguna() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola pengguna sistem monitoring server
          </p>
        </div>

        <div className="space-y-6">
          {/* Formulir Tambah Pengguna */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tambah Pengguna Baru
            </h2>
            <FormulirTambahPengguna />
          </div>

          {/* Tabel Pengguna */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Daftar Pengguna
            </h2>
            <TabelPengguna />
          </div>
        </div>
      </div>
    </div>
  )
}