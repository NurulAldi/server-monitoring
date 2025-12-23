'use client'

import Link from 'next/link'
import { Tombol } from '@/komponen/umum/Tombol'

interface Server {
  id: string
  nama: string
  status: 'online' | 'offline' | 'warning'
  cpu: number
  memori: number
  disk: number
  uptime: string
}

export default function DaftarServer() {
  // TODO: Fetch data dari API
  const dataServer: Server[] = [
    {
      id: 'server-1',
      nama: 'Web Server 1',
      status: 'online',
      cpu: 45,
      memori: 67,
      disk: 23,
      uptime: '15d 4h 32m',
    },
    {
      id: 'server-2',
      nama: 'Database Server',
      status: 'online',
      cpu: 78,
      memori: 89,
      disk: 45,
      uptime: '22d 12h 15m',
    },
    {
      id: 'server-3',
      nama: 'API Server',
      status: 'warning',
      cpu: 92,
      memori: 95,
      disk: 67,
      uptime: '5d 8h 45m',
    },
    {
      id: 'server-4',
      nama: 'Cache Server',
      status: 'offline',
      cpu: 0,
      memori: 0,
      disk: 0,
      uptime: '0d 0h 0m',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-emerald-700 bg-emerald-100 border border-emerald-300'
      case 'warning':
        return 'text-amber-700 bg-amber-100 border border-amber-300'
      case 'offline':
        return 'text-red-700 bg-red-100 border border-red-300'
      default:
        return 'text-slate-600 bg-slate-100 border border-slate-300'
    }
  }

  return (
    <div className="space-y-4">
      {dataServer.map((server) => (
        <div
          key={server.id}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
        >
          {/* Header: Server Name + Status + Action */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {server.nama}
              </h3>
              <p className="text-sm text-slate-500">ID: {server.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
                  server.status
                )}`}
              >
                {server.status.toUpperCase()}
              </span>
                <Tombol variant="outline" size="sm">Detail</Tombol>
            </div>
          </div>

          {/* Metrics Grid - Only show for active servers */}
          {server.status !== 'offline' && (
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">CPU</p>
                <p className="text-2xl font-bold text-slate-900">{server.cpu}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Memory</p>
                <p className="text-2xl font-bold text-slate-900">{server.memori}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Disk</p>
                <p className="text-2xl font-bold text-slate-900">{server.disk}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Uptime</p>
                <p className="text-base font-semibold text-slate-700">{server.uptime}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}