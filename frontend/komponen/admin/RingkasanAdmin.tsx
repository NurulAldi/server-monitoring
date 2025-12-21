'use client'

import { useEffect, useState } from 'react'
import { Users, Server, AlertTriangle, Activity } from 'lucide-react'

interface Statistik {
  totalPengguna: number
  totalServer: number
  totalAlertAktif: number
  totalMetrikHariIni: number
}

export default function RingkasanAdmin() {
  const [statistik, setStatistik] = useState<Statistik | null>(null)
  const [memuat, setMemuat] = useState(true)

  useEffect(() => {
    // TODO: Fetch admin statistics from API
    // For now, using mock data
    setStatistik({
      totalPengguna: 25,
      totalServer: 15,
      totalAlertAktif: 3,
      totalMetrikHariIni: 1247,
    })
    setMemuat(false)
  }, [])

  if (memuat) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  const kartuStatistik = [
    {
      label: 'Total Pengguna',
      nilai: statistik?.totalPengguna || 0,
      ikon: Users,
      warna: 'text-blue-600',
      bgWarna: 'bg-blue-50',
    },
    {
      label: 'Total Server',
      nilai: statistik?.totalServer || 0,
      ikon: Server,
      warna: 'text-green-600',
      bgWarna: 'bg-green-50',
    },
    {
      label: 'Alert Aktif',
      nilai: statistik?.totalAlertAktif || 0,
      ikon: AlertTriangle,
      warna: 'text-red-600',
      bgWarna: 'bg-red-50',
    },
    {
      label: 'Metrik Hari Ini',
      nilai: statistik?.totalMetrikHariIni || 0,
      ikon: Activity,
      warna: 'text-purple-600',
      bgWarna: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kartuStatistik.map((item) => {
        const Ikon = item.ikon
        return (
          <div key={item.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${item.bgWarna}`}>
                <Ikon className={`h-6 w-6 ${item.warna}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.nilai}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}