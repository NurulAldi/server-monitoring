import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import RingkasanDashboard from '@/komponen/pemantauan/RingkasanDashboard'
import DaftarServer from '@/komponen/pemantauan/DaftarServer'
import DaftarAlertAktif from '@/komponen/peringatan/DaftarAlertAktif'
import { Container } from '@/komponen/umum/Container'

// Point 1: SSR Isolation - Dynamic imports with ssr: false
const ChartCPU = dynamic(() => import('@/komponen/bagan/ChartCPU'), { ssr: false })
const ChartMemory = dynamic(() => import('@/komponen/bagan/ChartMemory'), { ssr: false })
const ChartNetwork = dynamic(() => import('@/komponen/bagan/ChartNetwork'), { ssr: false })
const ChartDisk = dynamic(() => import('@/komponen/bagan/ChartDisk'), { ssr: false })
const ChartLoad = dynamic(() => import('@/komponen/bagan/ChartLoad'), { ssr: false })
const ChartTemperature = dynamic(() => import('@/komponen/bagan/ChartTemperature'), { ssr: false })
const ChartResponseTime = dynamic(() => import('@/komponen/bagan/ChartResponseTime'), { ssr: false })
const ChartErrorRate = dynamic(() => import('@/komponen/bagan/ChartErrorRate'), { ssr: false })
const ChartUptime = dynamic(() => import('@/komponen/bagan/ChartUptime'), { ssr: false })
const ChartConnections = dynamic(() => import('@/komponen/bagan/ChartConnections'), { ssr: false })

export const metadata: Metadata = {
  title: 'Dashboard - Monitoring Server',
  description: 'Dashboard utama monitoring kesehatan server',
}

export default function HalamanDashboard() {
  // Stable dashboard ID for chart keys (NOT random, NOT timestamp)
  const dashboardId = 'main-dashboard'
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Container className="py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-display-lg text-slate-900">
            Dashboard Monitoring
          </h1>
          <p className="text-body-lg text-slate-600">
            Pantau kesehatan server Anda secara real-time
          </p>
        </div>

        {/* Ringkasan Dashboard */}
        <RingkasanDashboard />

        {/* Grid untuk komponen utama */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daftar Server */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Status Server</h2>
            </div>
            <div className="p-6">
              <DaftarServer />
            </div>
          </div>

          {/* Alert Aktif */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Alert Aktif</h2>
            </div>
            <div className="p-6">
              <DaftarAlertAktif />
            </div>
          </div>
        </div>

        {/* Visualisasi Data Health Server */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-display-md text-slate-900">
              Visualisasi Data Health Server
            </h2>
            <p className="text-body-lg text-slate-600 max-w-2xl mx-auto">
              Monitoring real-time untuk semua metrik kesehatan server
            </p>
          </div>

          {/* System Performance Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-cpu-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartCPU height={300} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-memory-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartMemory height={300} />
              </div>
            </div>
          </div>

          {/* Network & Storage Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-network-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartNetwork height={300} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-disk-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartDisk height={300} />
              </div>
            </div>
          </div>

          {/* System Load & Temperature */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-load-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartLoad height={300} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-temp-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartTemperature height={300} />
              </div>
            </div>
          </div>

          {/* Application Performance Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-response-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartResponseTime height={300} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-error-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartErrorRate height={300} />
              </div>
            </div>
          </div>

          {/* Service Availability Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-uptime-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartUptime height={300} />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-connections-chart`} style={{ height: '400px', overflow: 'hidden' }}>
                <ChartConnections height={300} />
              </div>
            </div>
          </div>
        </div>
        </Container>
    </div>
  )
}