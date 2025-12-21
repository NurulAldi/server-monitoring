import { Metadata } from 'next'
import LaporanMetrik from '@/komponen/umum/LaporanMetrik'
import LaporanAlert from '@/komponen/umum/LaporanAlert'
import FilterLaporan from '@/komponen/formulir/FilterLaporan'

export const metadata: Metadata = {
  title: 'Laporan - Admin',
  description: 'Panel admin untuk generate dan view laporan monitoring',
}

export default function HalamanAdminLaporan() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Laporan Sistem</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate dan unduh laporan monitoring server
          </p>
        </div>

        <div className="space-y-6">
          {/* Filter Laporan */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Filter Laporan
            </h2>
            <FilterLaporan />
          </div>

          {/* Laporan Metrik */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Laporan Metrik Server
            </h2>
            <LaporanMetrik />
          </div>

          {/* Laporan Alert */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Laporan Alert dan Peringatan
            </h2>
            <LaporanAlert />
          </div>
        </div>
      </div>
    </div>
  )
}