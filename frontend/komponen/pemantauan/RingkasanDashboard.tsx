'use client'

import { Server, CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react'
import MetricCard from '@/komponen/umum/MetricCard'

export default function RingkasanDashboard() {
  // TODO: Fetch data dari API
  const dataRingkasan = {
    totalServer: 5,
    serverOnline: 4,
    serverOffline: 1,
    alertAktif: 2,
    metrikHariIni: 1250,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <MetricCard
        title="Total Server"
        value={dataRingkasan.totalServer}
        icon={<Server className="w-5 h-5" />}
      />

      <MetricCard
        title="Server Online"
        value={dataRingkasan.serverOnline}
        subtitle="80% dari total"
        icon={<CheckCircle className="w-5 h-5" />}
        trend={{ value: 5.2, isPositive: true }}
      />

      <MetricCard
        title="Server Offline"
        value={dataRingkasan.serverOffline}
        subtitle="20% dari total"
        icon={<XCircle className="w-5 h-5" />}
        trend={{ value: 2.1, isPositive: false }}
      />

      <MetricCard
        title="Alert Aktif"
        value={dataRingkasan.alertAktif}
        subtitle="Perlu perhatian"
        icon={<AlertTriangle className="w-5 h-5" />}
        trend={{ value: 15.3, isPositive: false }}
      />

      <MetricCard
        title="Metrik Hari Ini"
        value={dataRingkasan.metrikHariIni.toLocaleString()}
        subtitle="Data points"
        icon={<Activity className="w-5 h-5" />}
        trend={{ value: 8.7, isPositive: true }}
      />
    </div>
  )
}