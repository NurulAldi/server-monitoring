import { Metadata } from 'next'
import RingkasanDashboard from '@/komponen/pemantauan/RingkasanDashboard'
import DaftarServer from '@/komponen/pemantauan/DaftarServer'
import DaftarAlertAktif from '@/komponen/peringatan/DaftarAlertAktif'
import { Card, CardHeader, CardTitle, CardBody } from '@/komponen/umum/Card'
import { Container } from '@/komponen/umum/Container'
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
    <div className="min-h-screen bg-pure-black">
      <Container className="py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-display-lg text-high-contrast">
            Dashboard Monitoring
          </h1>
          <p className="text-body-lg text-neutral-400">
            Pantau kesehatan server Anda secara real-time
          </p>
        </div>

        {/* Ringkasan Dashboard */}
        <RingkasanDashboard />

        {/* Grid untuk komponen utama */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daftar Server */}
          <Card hover>
            <CardHeader>
              <CardTitle>Status Server</CardTitle>
            </CardHeader>
            <CardBody>
              <DaftarServer />
            </CardBody>
          </Card>

          {/* Alert Aktif */}
          <Card hover>
            <CardHeader>
              <CardTitle>Alert Aktif</CardTitle>
            </CardHeader>
            <CardBody>
              <DaftarAlertAktif />
            </CardBody>
          </Card>
        </div>

        {/* Visualisasi Data Health Server */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-display-md text-high-contrast">
              Visualisasi Data Health Server
            </h2>
            <p className="text-body-lg text-neutral-400 max-w-2xl mx-auto">
              Monitoring real-time untuk semua metrik kesehatan server
            </p>
          </div>

          {/* System Performance Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card glass>
              <CardBody>
                <ChartCPU height={300} />
              </CardBody>
            </Card>
            <Card glass>
              <CardBody>
                <ChartMemory height={300} />
              </CardBody>
            </Card>
          </div>

          {/* Network & Storage Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card glass>
              <CardBody>
                <ChartNetwork height={300} />
              </CardBody>
            </Card>
            <Card glass>
              <CardBody>
                <ChartDisk height={300} />
              </CardBody>
            </Card>
          </div>

          {/* System Load & Temperature */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card glass>
              <CardBody>
                <ChartLoad height={300} />
              </CardBody>
            </Card>
            <Card glass>
              <CardBody>
                <ChartTemperature height={300} />
              </CardBody>
            </Card>
          </div>

          {/* Application Performance Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card glass>
              <CardBody>
                <ChartResponseTime height={300} />
              </CardBody>
            </Card>
            <Card glass>
              <CardBody>
                <ChartErrorRate height={300} />
              </CardBody>
            </Card>
          </div>

          {/* Service Availability Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card glass>
              <CardBody>
                <ChartUptime height={300} />
              </CardBody>
            </Card>
            <Card glass>
              <CardBody>
                <ChartConnections height={300} />
              </CardBody>
            </Card>
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