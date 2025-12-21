import { Metadata } from 'next'
import FormulirTambahServer from '@/komponen/formulir/FormulirTambahServer'

export const metadata: Metadata = {
  title: 'Tambah Server - Dashboard Monitoring',
  description: 'Tambahkan server baru ke sistem monitoring',
}

export default function HalamanTambahServer() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Server Baru</h1>
        <p className="mt-2 text-sm text-gray-600">
          Daftarkan server baru untuk dipantau kesehatan sistemnya
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <FormulirTambahServer />
        </div>
      </div>
    </div>
  )
}