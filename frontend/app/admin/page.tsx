import { Metadata } from 'next'
import RingkasanAdmin from '@/komponen/admin/RingkasanAdmin'
import StatistikSistem from '@/komponen/admin/StatistikSistem'

export const metadata: Metadata = {
  title: 'Dashboard Admin - Monitoring Server',
  description: 'Dashboard administrasi sistem monitoring server',
}

export default function HalamanDashboardAdmin() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pantau dan kelola seluruh sistem monitoring server
        </p>
      </div>

      <div className="space-y-6">
        {/* Ringkasan Admin */}
        <RingkasanAdmin />

        {/* Statistik Sistem */}
        <StatistikSistem />
      </div>
    </div>
  )
}