'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { KartuServer } from '@/komponen/pemantauan/KartuServer'
import { useServer } from '@/kait/useServer'

export default function DaftarServerLengkap() {
  const [pencarian, setPencarian] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const { server, memuat, ambilServer } = useServer()

  useEffect(() => {
    ambilServer()
  }, [ambilServer])

  const serverDifilter = server.filter((s) => {
    const cocokPencarian = s.nama.toLowerCase().includes(pencarian.toLowerCase()) ||
                          s.alamatIP.includes(pencarian)
    const cocokFilter = filterStatus === 'semua' || s.status === filterStatus
    return cocokPencarian && cocokFilter
  })

  return (
    <div className="space-y-6">
      {/* Header dengan kontrol */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Cari server berdasarkan nama atau IP..."
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="semua">Semua Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <Link href="/dashboard/pemantauan/tambah">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Server
            </Button>
          </Link>
        </div>
      </div>

      {/* Daftar Server */}
      {memuat ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat daftar server...</p>
        </div>
      ) : serverDifilter.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada server ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            {pencarian || filterStatus !== 'semua'
              ? 'Coba ubah kriteria pencarian atau filter'
              : 'Belum ada server yang terdaftar'}
          </p>
          {!pencarian && filterStatus === 'semua' && (
            <Link href="/dashboard/pemantauan/tambah">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Server Pertama
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serverDifilter.map((server) => (
            <KartuServer key={server.id} server={server} />
          ))}
        </div>
      )}

      {/* Statistik */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {server.filter(s => s.status === 'online').length}
            </div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {server.filter(s => s.status === 'offline').length}
            </div>
            <div className="text-sm text-gray-600">Offline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {server.filter(s => s.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {server.filter(s => s.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Error</div>
          </div>
        </div>
      </div>
    </div>
  )
}