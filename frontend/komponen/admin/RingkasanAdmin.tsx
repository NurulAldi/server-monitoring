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
          <div key={i} className="bg-deep-grey rounded-2xl border border-neutral-700 p-6 animate-pulse">
            <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-neutral-700 rounded w-1/2"></div>
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
      warna: 'text-accent-blue',
      bgWarna: 'bg-accent-blue/10',
    },
    {
      label: 'Total Server',
      nilai: statistik?.totalServer || 0,
      ikon: Server,
      warna: 'text-status-online',
      bgWarna: 'bg-status-online/10',
    },
    {
      label: 'Alert Aktif',
      nilai: statistik?.totalAlertAktif || 0,
      ikon: AlertTriangle,
      warna: 'text-accent-red',
      bgWarna: 'bg-accent-red/10',
    },
    {
      label: 'Metrik Hari Ini',
      nilai: statistik?.totalMetrikHariIni || 0,
      ikon: Activity,
      warna: 'text-warning-amber',
      bgWarna: 'bg-warning-amber/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kartuStatistik.map((item) => {
        const Ikon = item.ikon
        return (
          <div key={item.label} className="bg-deep-grey rounded-2xl border border-neutral-700 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${item.bgWarna}`}>
                <Ikon className={`h-6 w-6 ${item.warna}`} />
              </div>
              <div className="ml-4">
                <p className="text-body-sm font-medium text-neutral-400">{item.label}</p>
                <p className="text-display-lg font-bold text-high-contrast">{item.nilai}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}