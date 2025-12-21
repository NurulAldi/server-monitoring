'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

const skemaPenggunaBaru = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  jabatan: z.string().min(1, 'Jabatan harus diisi'),
  kataSandi: z.string().min(6, 'Kata sandi minimal 6 karakter'),
})

type DataPenggunaBaru = z.infer<typeof skemaPenggunaBaru>

export default function FormulirTambahPengguna() {
  const [sedangMemuat, setSedangMemuat] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DataPenggunaBaru>({
    resolver: zodResolver(skemaPenggunaBaru),
  })

  const onSubmit = async (data: DataPenggunaBaru) => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi tambah pengguna API
      console.log('Data pengguna baru:', data)
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      reset() // Reset form setelah berhasil
    } catch (error) {
      console.error('Error tambah pengguna:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input
            id="nama"
            {...register('nama')}
            className="mt-1"
          />
          {errors.nama && (
            <p className="mt-1 text-sm text-red-600">{errors.nama.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className="mt-1"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="jabatan">Jabatan</Label>
          <Input
            id="jabatan"
            {...register('jabatan')}
            className="mt-1"
          />
          {errors.jabatan && (
            <p className="mt-1 text-sm text-red-600">{errors.jabatan.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="kataSandi">Kata Sandi</Label>
          <Input
            id="kataSandi"
            type="password"
            {...register('kataSandi')}
            className="mt-1"
          />
          {errors.kataSandi && (
            <p className="mt-1 text-sm text-red-600">{errors.kataSandi.message}</p>
          )}
        </div>
      </div>

      <Tombol type="submit" disabled={sedangMemuat}>
        {sedangMemuat ? 'Menambah...' : 'Tambah Pengguna'}
      </Tombol>
    </form>
  )
}