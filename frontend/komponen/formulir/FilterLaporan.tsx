'use client'

import { useState } from 'react'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

export default function FilterLaporan() {
  const [filter, setFilter] = useState({
    tanggalMulai: '',
    tanggalAkhir: '',
    server: '',
    jenisLaporan: 'metrik',
  })

  const handleChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const terapkanFilter = () => {
    // TODO: Implementasi filter laporan
    console.log('Filter laporan:', filter)
  }

  const resetFilter = () => {
    setFilter({
      tanggalMulai: '',
      tanggalAkhir: '',
      server: '',
      jenisLaporan: 'metrik',
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
          <Input
            id="tanggalMulai"
            type="date"
            value={filter.tanggalMulai}
            onChange={(e) => handleChange('tanggalMulai', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="tanggalAkhir">Tanggal Akhir</Label>
          <Input
            id="tanggalAkhir"
            type="date"
            value={filter.tanggalAkhir}
            onChange={(e) => handleChange('tanggalAkhir', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="server">Server</Label>
          <select
            id="server"
            value={filter.server}
            onChange={(e) => handleChange('server', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-neutral-700 bg-deep-grey px-3 py-2 text-body text-high-contrast focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
          >
            <option value="">Semua Server</option>
            <option value="server-1">Web Server 1</option>
            <option value="server-2">Database Server</option>
            <option value="server-3">API Server</option>
          </select>
        </div>

        <div>
          <Label htmlFor="jenisLaporan">Jenis Laporan</Label>
          <select
            id="jenisLaporan"
            value={filter.jenisLaporan}
            onChange={(e) => handleChange('jenisLaporan', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-neutral-700 bg-deep-grey px-3 py-2 text-body text-high-contrast focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
          >
            <option value="metrik">Laporan Metrik</option>
            <option value="alert">Laporan Alert</option>
            <option value="performa">Laporan Performa</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-4">
        <Tombol onClick={terapkanFilter}>
          Terapkan Filter
        </Tombol>
        <Tombol variant="outline" onClick={resetFilter}>
          Reset Filter
        </Tombol>
        <Tombol variant="outline">
          Export PDF
        </Tombol>
        <Tombol variant="outline">
          Export Excel
        </Tombol>
      </div>
    </div>
  )
}