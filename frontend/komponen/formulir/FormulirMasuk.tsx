'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAutentikasi } from '@/kait/useAutentikasi'
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
  const [loginError, setLoginError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams?.get('registered') === '1'
  const { login } = useAutentikasi()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataMasuk>({
    resolver: zodResolver(skemaMasuk),
  })

  const onSubmit = async (data: DataMasuk) => {
    setSedangMemuat(true)
    setLoginError('')
    try {
      await login(data)
      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err: any) {
      // Network errors
      if (!err?.response) {
        const attempted = err?.attemptedURL || (err?.config ? `${(err.config.baseURL||'').replace(/\/$/,'')}${err.config.url||''}` : `${KONSTANTA.API_BASE_URL.replace(/\/$/,'')}/api/pengguna/login`)
        setLoginError(`Tidak dapat terhubung ke server di ${attempted}. Pastikan backend berjalan dan variabel NEXT_PUBLIC_API_URL sudah benar.`)
      } else {
        const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Login gagal. Periksa kredensial Anda.'
        setLoginError(msg)
      }
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Feedback messages */}
      {registered && (
        <div className="p-3 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm text-center">
          Registrasi berhasil. Silakan masuk menggunakan akun Anda.
        </div>
      )}

      {loginError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          {loginError}
        </div>
      )}

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
          className="text-body-sm text-neutral-400 hover:text-high-contrast transition-all duration-300 ease-in-out"
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
            className="text-high-contrast hover:text-soft-white font-medium transition-all duration-300 ease-in-out"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </form>
  )
}