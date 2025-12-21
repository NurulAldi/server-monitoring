'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface DataStatistik {
  penggunaAktif: Array<{tanggal: string, jumlah: number}>
  serverStatus: Array<{nama: string, nilai: number}>
  alertPerHari: Array<{tanggal: string, jumlah: number}>
  penggunaanCPU: Array<{waktu: string, cpu: number}>
}

const WARNA_STATUS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280']

export default function StatistikSistem() {
  const [data, setData] = useState<DataStatistik | null>(null)
  const [memuat, setMemuat] = useState(true)

  useEffect(() => {
    // TODO: Fetch system statistics from API
    // For now, using mock data
    setData({
      penggunaAktif: [
        { tanggal: '2024-01-01', jumlah: 20 },
        { tanggal: '2024-01-02', jumlah: 22 },
        { tanggal: '2024-01-03', jumlah: 25 },
        { tanggal: '2024-01-04', jumlah: 23 },
        { tanggal: '2024-01-05', jumlah: 26 },
        { tanggal: '2024-01-06', jumlah: 28 },
        { tanggal: '2024-01-07', jumlah: 30 },
      ],
      serverStatus: [
        { nama: 'Online', nilai: 12 },
        { nama: 'Warning', nilai: 2 },
        { nama: 'Offline', nilai: 1 },
        { nama: 'Error', nilai: 0 },
      ],
      alertPerHari: [
        { tanggal: '2024-01-01', jumlah: 2 },
        { tanggal: '2024-01-02', jumlah: 1 },
        { tanggal: '2024-01-03', jumlah: 3 },
        { tanggal: '2024-01-04', jumlah: 0 },
        { tanggal: '2024-01-05', jumlah: 2 },
        { tanggal: '2024-01-06', jumlah: 1 },
        { tanggal: '2024-01-07', jumlah: 1 },
      ],
      penggunaanCPU: [
        { waktu: '00:00', cpu: 45 },
        { waktu: '04:00', cpu: 32 },
        { waktu: '08:00', cpu: 67 },
        { waktu: '12:00', cpu: 78 },
        { waktu: '16:00', cpu: 89 },
        { waktu: '20:00', cpu: 56 },
      ],
    })
    setMemuat(false)
  }, [])

  if (memuat) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengguna Aktif */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pengguna Aktif per Hari
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.penggunaAktif}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jumlah" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Server */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribusi Status Server
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.serverStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nama, persen }) => `${nama} ${(persen * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="nilai"
              >
                {data?.serverStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={WARNA_STATUS[index % WARNA_STATUS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Alert per Hari */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Alert per Hari
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.alertPerHari}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="jumlah" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Penggunaan CPU Rata-rata */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Penggunaan CPU Rata-rata
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.penggunaanCPU}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="waktu" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}