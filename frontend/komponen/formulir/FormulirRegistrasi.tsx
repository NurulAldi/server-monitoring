'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'
import { layananAutentikasi } from '@/layanan/autentikasi'
import { KONSTANTA } from '@/utilitas/konstanta'

const skemaRegistrasi = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  // Align password rules with backend (min 8, must include uppercase, lowercase and number)
  kataSandi: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Kata sandi harus mengandung huruf besar, huruf kecil, dan angka'),
  konfirmasiKataSandi: z.string(),
}).refine((data) => data.kataSandi === data.konfirmasiKataSandi, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['konfirmasiKataSandi'],
})

type DataRegistrasi = z.infer<typeof skemaRegistrasi>

export default function FormulirRegistrasi() {
  const [sedangMemuat, setSedangMemuat] = useState(false)
  const [kesalahan, setKesalahan] = useState('')
  const [sukses, setSukses] = useState('')
  const router = useRouter()

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
    setSukses('')

    try {
      // Call backend registration endpoint (send 'nama' to match backend validator)
      await layananAutentikasi.register({ nama: data.nama, email: data.email, kataSandi: data.kataSandi })
      // Show success and redirect to login with success flag
      setSukses('Registrasi berhasil. Silakan masuk menggunakan akun Anda.')
      router.push('/autentikasi?registered=1')
    } catch (err: any) {
      // Handle network errors separately for actionable feedback
      const resp = err?.response?.data
      let msg = 'Registrasi gagal. Silakan coba lagi.'

      if (!err?.response) {
        // Try to extract attempted URL from axios error, fallback to a sensible default
        const attempted = err?.attemptedURL || (err?.config ? `${(err.config.baseURL||'').replace(/\/$/,'')}${err.config.url||''}` : `${KONSTANTA.API_BASE_URL.replace(/\/$/,'')}/api/pengguna/registrasi`)
        msg = `Tidak dapat terhubung ke server di ${attempted}. Pastikan backend berjalan dan variabel NEXT_PUBLIC_API_URL sudah benar.`
      } else if (resp?.error?.message) {
        msg = resp.error.message
        if (Array.isArray(resp.error.details) && resp.error.details.length > 0) {
          // Append validation details
          msg += ' ' + resp.error.details.map(d => `${d.field}: ${d.message}`).join('; ')
        }
      } else if (resp?.message) {
        msg = resp.message
      }

      setKesalahan(msg)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="nama" required>Nama Lengkap</Label>
        <Input
          id="nama"
          type="text"
          placeholder="Masukkan nama lengkap"
          error={!!errors.nama}
          {...register('nama')}
        />
        {errors.nama && (
          <p className="text-body-sm text-accent-red mt-2">{errors.nama.message}</p>
        )}
      </div>

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
          placeholder="Minimal 6 karakter"
          error={!!errors.kataSandi}
          {...register('kataSandi')}
        />
        {errors.kataSandi && (
          <p className="text-body-sm text-accent-red mt-2">{errors.kataSandi.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="konfirmasiKataSandi" required>Konfirmasi Kata Sandi</Label>
        <Input
          id="konfirmasiKataSandi"
          type="password"
          placeholder="Ulangi kata sandi"
          error={!!errors.konfirmasiKataSandi}
          {...register('konfirmasiKataSandi')}
        />
        {errors.konfirmasiKataSandi && (
          <p className="text-body-sm text-accent-red mt-2">{errors.konfirmasiKataSandi.message}</p>
        )}
      </div>

      {kesalahan && (
        <div className="p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
          <p className="text-body-sm text-accent-red text-center">{kesalahan}</p>
        </div>
      )}

      <Tombol
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={sedangMemuat}
      >
        {sedangMemuat ? 'Mendaftarkan...' : 'Daftar'}
      </Tombol>

      <div className="text-center pt-4 border-t border-neutral-700">
        <p className="text-body text-neutral-400">
          Sudah punya akun?{' '}
          <Link
            href="/autentikasi"
            className="text-high-contrast hover:text-soft-white font-medium transition-all duration-300 ease-in-out"
          >
            Masuk
          </Link>
        </p>
      </div>
    </form>
  )
}