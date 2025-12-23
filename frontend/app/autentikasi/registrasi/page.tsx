import { Metadata } from 'next'
import FormulirRegistrasi from '@/komponen/formulir/FormulirRegistrasi'
import { Card, CardBody } from '@/komponen/umum/Card'

export const metadata: Metadata = {
  title: 'Registrasi - Dashboard Monitoring',
  description: 'Buat akun baru untuk dashboard monitoring server',
}

export default function HalamanRegistrasi() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        <div className="text-center space-y-4">
          <h2 className="text-display-md text-slate-900">
            Buat Akun Baru
          </h2>
          <p className="text-body-lg text-slate-600">
            Daftar untuk mulai memantau server Anda
          </p>
        </div>
        <Card glass>
          <CardBody>
            <FormulirRegistrasi />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}