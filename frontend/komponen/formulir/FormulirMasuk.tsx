'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

const skemaMasuk = z.object({
  email: z.string().email('Email tidak valid'),
  kataSandi: z.string().min(6, 'Kata sandi minimal 6 karakter'),
})

type DataMasuk = z.infer<typeof skemaMasuk>

export default function FormulirMasuk() {
  const [sedangMemuat, setSedangMemuat] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataMasuk>({
    resolver: zodResolver(skemaMasuk),
  })

  const onSubmit = async (data: DataMasuk) => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi login API
      console.log('Data login:', data)
      // Redirect ke dashboard setelah login berhasil
    } catch (error) {
      console.error('Error login:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nama@email.com"
          {...register('email')}
          className="mt-1"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="kataSandi">Kata Sandi</Label>
        <Input
          id="kataSandi"
          type="password"
          placeholder="Masukkan kata sandi"
          {...register('kataSandi')}
          className="mt-1"
        />
        {errors.kataSandi && (
          <p className="mt-1 text-sm text-red-600">{errors.kataSandi.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            href="/autentikasi/lupa-kata-sandi"
            className="font-medium text-primary hover:text-primary/80"
          >
            Lupa kata sandi?
          </Link>
        </div>
      </div>

      <Tombol
        type="submit"
        className="w-full"
        disabled={sedangMemuat}
      >
        {sedangMemuat ? 'Sedang Masuk...' : 'Masuk'}
      </Tombol>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link
            href="/autentikasi/registrasi"
            className="font-medium text-primary hover:text-primary/80"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </form>
  )
}