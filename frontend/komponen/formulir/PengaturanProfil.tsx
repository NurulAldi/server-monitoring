'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

const skemaProfil = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  jabatan: z.string().optional(),
})

type DataProfil = z.infer<typeof skemaProfil>

export default function PengaturanProfil() {
  const [sedangMemuat, setSedangMemuat] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataProfil>({
    resolver: zodResolver(skemaProfil),
    defaultValues: {
      nama: 'Admin User',
      email: 'admin@example.com',
      jabatan: 'Administrator',
    },
  })

  const onSubmit = async (data: DataProfil) => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi update profil API
      console.log('Data profil:', data)
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error update profil:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
      </div>

      <Tombol type="submit" disabled={sedangMemuat}>
        {sedangMemuat ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Tombol>
    </form>
  )
}