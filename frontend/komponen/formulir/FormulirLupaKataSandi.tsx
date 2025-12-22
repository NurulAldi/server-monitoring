'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

const skemaLupaKataSandi = z.object({
  email: z.string().email('Email tidak valid'),
})

type DataLupaKataSandi = z.infer<typeof skemaLupaKataSandi>

export default function FormulirLupaKataSandi() {
  const [sedangMemuat, setSedangMemuat] = useState(false)
  const [emailTerkirim, setEmailTerkirim] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataLupaKataSandi>({
    resolver: zodResolver(skemaLupaKataSandi),
  })

  const onSubmit = async (data: DataLupaKataSandi) => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi reset password API
      console.log('Email reset password:', data.email)
      setEmailTerkirim(true)
    } catch (error) {
      console.error('Error reset password:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  if (emailTerkirim) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-heading-md font-medium text-high-contrast mt-2">
            Email Terkirim!
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Kami telah mengirim link reset kata sandi ke email Anda.
          </p>
        </div>
        <Link href="/autentikasi">
          <Tombol>Kembali ke Login</Tombol>
        </Link>
      </div>
    )
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

      <Tombol
        type="submit"
        className="w-full"
        disabled={sedangMemuat}
      >
        {sedangMemuat ? 'Mengirim...' : 'Kirim Link Reset'}
      </Tombol>

      <div className="text-center">
        <Link
          href="/autentikasi"
          className="font-medium text-primary hover:text-primary/80"
        >
          Kembali ke Login
        </Link>
      </div>
    </form>
  )
}