'use client'

import { Server, CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react'
import MetricCard from '@/komponen/umum/MetricCard'
import { useMonitoringData } from '@/soket/useMonitoring'

export default function RingkasanDashboard() {
  const { data, loading, error } = useMonitoringData()

  // Fallback data if API fails
  const fallbackData = {
    totalServer: 0,
    serverOnline: 0,
    serverOffline: 0,
    alertAktif: 0,
    metrikHariIni: 0,
  }

  const dataRingkasan = data ? {
    totalServer: data.ringkasan.totalServer,
    serverOnline: data.ringkasan.sehat + data.ringkasan.peringatan, // Online = healthy + warning
    serverOffline: data.ringkasan.offline,
    alertAktif: data.metrikGlobal.alertAktif,
    metrikHariIni: Math.floor(Math.random() * 1000) + 500, // TODO: Get real metric count
  } : fallbackData

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800">Failed to load dashboard data: {error}</p>
        </div>
      </div>
    )
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
        subtitle={`${dataRingkasan.totalServer > 0 ? Math.round((dataRingkasan.serverOnline / dataRingkasan.totalServer) * 100) : 0}% dari total`}
        icon={<CheckCircle className="w-5 h-5" />}
        trend={{ value: 5.2, isPositive: true }}
      />

      <MetricCard
        title="Server Offline"
        value={dataRingkasan.serverOffline}
        subtitle={`${dataRingkasan.totalServer > 0 ? Math.round((dataRingkasan.serverOffline / dataRingkasan.totalServer) * 100) : 0}% dari total`}
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