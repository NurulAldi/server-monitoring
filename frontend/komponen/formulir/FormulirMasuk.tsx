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
      <div className="space-y-2">
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nama@email.com"
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-body-sm text-accent-red mt-2">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="kataSandi" required>Kata Sandi</Label>
        <Input
          id="kataSandi"
          type="password"
          placeholder="Masukkan kata sandi"
          error={!!errors.kataSandi}
          {...register('kataSandi')}
        />
        {errors.kataSandi && (
          <p className="text-body-sm text-accent-red mt-2">{errors.kataSandi.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/autentikasi/lupa-kata-sandi"
          className="text-body-sm text-neutral-400 hover:text-high-contrast transition-smooth"
        >
          Lupa kata sandi?
        </Link>
      </div>

      <Tombol
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={sedangMemuat}
      >
        {sedangMemuat ? 'Sedang Masuk...' : 'Masuk'}
      </Tombol>

      <div className="text-center pt-4 border-t border-neutral-700">
        <p className="text-body text-neutral-400">
          Belum punya akun?{' '}
          <Link
            href="/autentikasi/registrasi"
            className="text-high-contrast hover:text-soft-white font-medium transition-smooth"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </form>
  )
}