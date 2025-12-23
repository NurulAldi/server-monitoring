'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { KartuAlert } from '@/komponen/peringatan/KartuAlert'
import { useAlert } from '@/kait/useAlert'

export default function DaftarAlertLengkap() {
  const [pencarian, setPencarian] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [filterTingkat, setFilterTingkat] = useState('semua')
  const { alert, memuat, ambilAlert } = useAlert()

  useEffect(() => {
    ambilAlert()
  }, [ambilAlert])

  const alertDifilter = alert.filter((a) => {
    const cocokPencarian = a.pesan.toLowerCase().includes(pencarian.toLowerCase()) ||
                          a.server.nama.toLowerCase().includes(pencarian.toLowerCase())
    const cocokStatus = filterStatus === 'semua' || a.status === filterStatus
    const cocokTingkat = filterTingkat === 'semua' || a.tingkat === filterTingkat
    return cocokPencarian && cocokStatus && cocokTingkat
  })

  return (
    <div className="space-y-6">
      {/* Header dengan kontrol */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Cari alert berdasarkan pesan atau server..."
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-body bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="ditangani">Ditangani</option>
              <option value="ditutup">Ditutup</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-slate-600" />
            <select
              value={filterTingkat}
              onChange={(e) => setFilterTingkat(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-body bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua Tingkat</option>
              <option value="kritis">Kritis</option>
              <option value="peringatan">Peringatan</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daftar Alert */}
      {memuat ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat daftar alert...</p>
        </div>
      ) : alertDifilter.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-heading-md font-medium text-slate-900 mb-2">
            Tidak ada alert ditemukan
          </h3>
          <p className="text-gray-600">
            {pencarian || filterStatus !== 'semua' || filterTingkat !== 'semua'
              ? 'Coba ubah kriteria pencarian atau filter'
              : 'Belum ada alert yang tercatat'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertDifilter.map((alert) => (
            <KartuAlert key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Statistik */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-heading-md font-semibold text-slate-900 mb-4">Ringkasan Alert</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {alert.filter(a => a.status === 'aktif' && a.tingkat === 'kritis').length}
            </div>
            <div className="text-sm text-gray-600">Kritis Aktif</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {alert.filter(a => a.status === 'aktif' && a.tingkat === 'peringatan').length}
            </div>
            <div className="text-sm text-gray-600">Peringatan Aktif</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {alert.filter(a => a.status === 'ditangani').length}
            </div>
            <div className="text-sm text-gray-600">Ditangani</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {alert.filter(a => a.status === 'ditutup').length}
            </div>
            <div className="text-sm text-gray-600">Ditutup</div>
          </div>
        </div>
      </div>
    </div>
  )
}