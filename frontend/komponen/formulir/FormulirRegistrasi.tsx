'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'
import { useAutentikasi } from '@/kait/useAutentikasi'

const skemaRegistrasi = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  kataSandi: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  konfirmasiKataSandi: z.string(),
}).refine((data) => data.kataSandi === data.konfirmasiKataSandi, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['konfirmasiKataSandi'],
})

type DataRegistrasi = z.infer<typeof skemaRegistrasi>

export default function FormulirRegistrasi() {
  const [sedangMemuat, setSedangMemuat] = useState(false)
  const [kesalahan, setKesalahan] = useState('')
  const router = useRouter()
  const { registrasi } = useAutentikasi()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataRegistrasi>({
    resolver: zodResolver(skemaRegistrasi),
  })

  const onSubmit = async (data: DataRegistrasi) => {
    setSedangMemuat(true)
    setKesalahan('')

    try {
      await registrasi(data.nama, data.email, data.kataSandi)
      router.push('/dashboard')
    } catch (error) {
      setKesalahan('Registrasi gagal. Silakan coba lagi.')
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input
            id="nama"
            type="text"
            {...register('nama')}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Masukkan nama lengkap"
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
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Masukkan email"
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
            {...register('kataSandi')}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Masukkan kata sandi"
          />
          {errors.kataSandi && (
            <p className="mt-1 text-sm text-red-600">{errors.kataSandi.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="konfirmasiKataSandi">Konfirmasi Kata Sandi</Label>
          <Input
            id="konfirmasiKataSandi"
            type="password"
            {...register('konfirmasiKataSandi')}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Konfirmasi kata sandi"
          />
          {errors.konfirmasiKataSandi && (
            <p className="mt-1 text-sm text-red-600">{errors.konfirmasiKataSandi.message}</p>
          )}
        </div>
      </div>

      {kesalahan && (
        <div className="text-red-600 text-sm text-center">{kesalahan}</div>
      )}

      <div>
        <Button
          type="submit"
          disabled={sedangMemuat}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {sedangMemuat ? 'Mendaftarkan...' : 'Daftar'}
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/autentikasi"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sudah punya akun? Masuk
        </Link>
      </div>
    </form>
  )
}