'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

const skemaServerBaru = z.object({
  nama: z.string().min(2, 'Nama server minimal 2 karakter'),
  ip: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Format IP tidak valid'),
  lokasi: z.string().min(1, 'Lokasi harus diisi'),
  deskripsi: z.string().optional(),
})

type DataServerBaru = z.infer<typeof skemaServerBaru>

export default function FormulirTambahServer() {
  const [sedangMemuat, setSedangMemuat] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DataServerBaru>({
    resolver: zodResolver(skemaServerBaru),
  })

  const onSubmit = async (data: DataServerBaru) => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi tambah server API
      console.log('Data server baru:', data)
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      reset() // Reset form setelah berhasil
    } catch (error) {
      console.error('Error tambah server:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="nama">Nama Server</Label>
          <Input
            id="nama"
            {...register('nama')}
            className="mt-1"
            placeholder="Web Server 1"
          />
          {errors.nama && (
            <p className="mt-1 text-sm text-red-600">{errors.nama.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="ip">IP Address</Label>
          <Input
            id="ip"
            {...register('ip')}
            className="mt-1"
            placeholder="192.168.1.100"
          />
          {errors.ip && (
            <p className="mt-1 text-sm text-red-600">{errors.ip.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lokasi">Lokasi</Label>
          <Input
            id="lokasi"
            {...register('lokasi')}
            className="mt-1"
            placeholder="Data Center A"
          />
          {errors.lokasi && (
            <p className="mt-1 text-sm text-red-600">{errors.lokasi.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
          <Input
            id="deskripsi"
            {...register('deskripsi')}
            className="mt-1"
            placeholder="Deskripsi server"
          />
        </div>
      </div>

      <Tombol type="submit" disabled={sedangMemuat}>
        {sedangMemuat ? 'Menambah...' : 'Tambah Server'}
      </Tombol>
    </form>
  )
}