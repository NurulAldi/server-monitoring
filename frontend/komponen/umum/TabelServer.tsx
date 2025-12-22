'use client'

import { Tombol } from '@/komponen/umum/Tombol'

interface Server {
  id: string
  nama: string
  ip: string
  status: 'online' | 'offline' | 'maintenance'
  lokasi: string
  terakhirUpdate: string
}

export default function TabelServer() {
  // TODO: Fetch data server dari API
  const dataServer: Server[] = [
    {
      id: 'server-1',
      nama: 'Web Server 1',
      ip: '192.168.1.100',
      status: 'online',
      lokasi: 'Data Center A',
      terakhirUpdate: '2024-01-15 14:30:00',
    },
    {
      id: 'server-2',
      nama: 'Database Server',
      ip: '192.168.1.101',
      status: 'online',
      lokasi: 'Data Center A',
      terakhirUpdate: '2024-01-15 14:29:45',
    },
    {
      id: 'server-3',
      nama: 'API Server',
      ip: '192.168.1.102',
      status: 'maintenance',
      lokasi: 'Data Center B',
      terakhirUpdate: '2024-01-15 10:15:30',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-status-online bg-status-online/10'
      case 'offline':
        return 'text-accent-red bg-accent-red/10'
      case 'maintenance':
        return 'text-warning-amber bg-warning-amber/10'
      default:
        return 'text-neutral-400 bg-neutral-700/10'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-700">
        <thead className="bg-neutral-800">
          <tr>
            <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-500 uppercase tracking-wider">
              Nama Server
            </th>
            <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-500 uppercase tracking-wider">
              IP Address
            </th>
            <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-500 uppercase tracking-wider">
              Lokasi
            </th>
            <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-500 uppercase tracking-wider">
              Terakhir Update
            </th>
            <th className="px-6 py-3 text-right text-data-label font-medium text-neutral-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-deep-grey divide-y divide-neutral-700">
          {dataServer.map((server) => (
            <tr key={server.id}>
              <td className="px-6 py-4 whitespace-nowrap text-body font-medium text-high-contrast">
                {server.nama}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-sm text-neutral-400">
                {server.ip}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-medium ${getStatusColor(
                    server.status
                  )}`}
                >
                  {server.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-sm text-neutral-400">
                {server.lokasi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-body-sm text-neutral-400">
                {server.terakhirUpdate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <Tombol variant="outline" size="sm">
                    Edit
                  </Tombol>
                  <Tombol variant="destructive" size="sm">
                    Hapus
                  </Tombol>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}