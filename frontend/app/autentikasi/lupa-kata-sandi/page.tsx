import { Metadata } from 'next'
import FormulirLupaKataSandi from '@/komponen/formulir/FormulirLupaKataSandi'

export const metadata: Metadata = {
  title: 'Lupa Kata Sandi - Dashboard Monitoring',
  description: 'Reset kata sandi akun dashboard monitoring',
}

export default function HalamanLupaKataSandi() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Lupa Kata Sandi
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan email Anda untuk menerima link reset kata sandi
          </p>
        </div>
        <FormulirLupaKataSandi />
      </div>
    </div>
  )
}