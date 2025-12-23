import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import RingkasanDashboard from '@/komponen/pemantauan/RingkasanDashboard'
import DaftarServer from '@/komponen/pemantauan/DaftarServer'
import DaftarAlertAktif from '@/komponen/peringatan/DaftarAlertAktif'
import { Container } from '@/komponen/umum/Container'
import FloatingChatButton from '@/komponen/umum/FloatingChatButton'

// SIMPLIFIED: Only 4 core metric charts
const ChartCPU = dynamic(() => import('@/komponen/bagan/ChartCPU'), { ssr: false })
const ChartMemory = dynamic(() => import('@/komponen/bagan/ChartMemory'), { ssr: false })
const ChartDisk = dynamic(() => import('@/komponen/bagan/ChartDisk'), { ssr: false })
const ChartTemperature = dynamic(() => import('@/komponen/bagan/ChartTemperature'), { ssr: false })

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

        {/* Visualisasi Data Health Server - SIMPLIFIED: 4 Core Metrics Only */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-display-md text-slate-900">
              Core Server Metrics
            </h2>
            <p className="text-body-lg text-slate-600 max-w-2xl mx-auto">
              Real-time monitoring: CPU, RAM, Disk, and Temperature
            </p>
          </div>

          {/* 4 Core Metrics Grid - Balanced 2x2 Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* CPU Usage */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-cpu-chart`} className="h-[400px] w-full overflow-hidden">
                <ChartCPU />
              </div>
            </div>

            {/* RAM Usage */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-memory-chart`} className="h-[400px] w-full overflow-hidden">
                <ChartMemory />
              </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-disk-chart`} className="h-[400px] w-full overflow-hidden">
                <ChartDisk />
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div key={`${dashboardId}-temp-chart`} className="h-[400px] w-full overflow-hidden">
                <ChartTemperature />
              </div>
            </div>
          </div>
        </div>
        </Container>
        {/* Keep floating chat button only on dashboard */}
        <div aria-hidden className="fixed right-6 bottom-6 z-50">
          <FloatingChatButton />
        </div>
    </div>
  )
}