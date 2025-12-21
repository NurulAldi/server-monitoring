import { Metadata } from 'next'
import RingkasanDashboard from '@/komponen/pemantauan/RingkasanDashboard'
import DaftarServer from '@/komponen/pemantauan/DaftarServer'
import DaftarAlertAktif from '@/komponen/peringatan/DaftarAlertAktif'
import {
  ChartCPU,
  ChartMemory,
  ChartNetwork,
  ChartDisk,
  ChartLoad,
  ChartTemperature,
  ChartResponseTime,
  ChartErrorRate,
  ChartUptime,
  ChartConnections
} from '@/komponen/bagan'
import ChatbotAI from '@/komponen/umum/ChatbotAI'

export const metadata: Metadata = {
  title: 'Dashboard - Monitoring Server',
  description: 'Dashboard utama monitoring kesehatan server',
}

export default function HalamanDashboard() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-display text-text-primary glow-cyan">
            Dashboard Monitoring
          </h1>
          <p className="mt-2 text-body text-text-secondary">
            Pantau kesehatan server Anda secara real-time
          </p>
        </div>

        <div className="space-y-6">
          {/* Ringkasan Dashboard */}
          <RingkasanDashboard />

          {/* Grid untuk komponen utama */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daftar Server */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-heading text-text-primary">
                  Status Server
                </h2>
              </div>
              <div className="card-body">
                <DaftarServer />
              </div>
            </div>

            {/* Alert Aktif */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-heading text-text-primary">
                  Alert Aktif
                </h2>
              </div>
              <div className="card-body">
                <DaftarAlertAktif />
              </div>
            </div>
          </div>

          {/* Visualisasi Data Health Server */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-heading text-text-primary glow-cyan mb-2">
                Visualisasi Data Health Server
              </h2>
              <p className="text-body text-text-secondary">
                Monitoring real-time untuk semua metrik kesehatan server
              </p>
            </div>

            {/* System Performance Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-body">
                  <ChartCPU height={300} />
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <ChartMemory height={300} />
                </div>
              </div>
            </div>

            {/* Network & Storage Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-body">
                  <ChartNetwork height={300} />
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <ChartDisk height={300} />
                </div>
              </div>
            </div>

            {/* System Load & Temperature */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-body">
                  <ChartLoad height={300} />
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <ChartTemperature height={300} />
                </div>
              </div>
            </div>

            {/* Application Performance Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-body">
                  <ChartResponseTime height={300} />
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <ChartErrorRate height={300} />
                </div>
              </div>
            </div>

            {/* Service Availability Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-body">
                  <ChartUptime height={300} />
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <ChartConnections height={300} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant Chatbot */}
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <h2 className="text-heading text-text-primary">
                  AI Assistant
                </h2>
                <p className="text-body-small text-text-secondary">
                  Tanyakan tentang kesehatan server atau analisis data
                </p>
              </div>
              <div className="card-body">
                <ChatbotAI className="h-96" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}