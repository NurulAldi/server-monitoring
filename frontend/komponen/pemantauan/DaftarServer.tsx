'use client'

import Link from 'next/link'
import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'
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
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'offline':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-4">
      {dataServer.map((server) => (
        <Kartu key={server.id}>
          <KontenKartu>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {server.nama}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {server.id}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    server.status
                  )}`}
                >
                  {server.status.toUpperCase()}
                </span>
              </div>
              <Link href={`/dashboard/pemantauan/${server.id}`}>
                <Tombol variant="outline" size="sm">
                  Detail
                </Tombol>
              </Link>
            </div>

            {server.status !== 'offline' && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">CPU</p>
                  <p className="text-lg font-semibold">{server.cpu}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Memori</p>
                  <p className="text-lg font-semibold">{server.memori}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Disk</p>
                  <p className="text-lg font-semibold">{server.disk}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-sm font-semibold">{server.uptime}</p>
                </div>
              </div>
            )}
          </KontenKartu>
        </Kartu>
      ))}
    </div>
  )
}