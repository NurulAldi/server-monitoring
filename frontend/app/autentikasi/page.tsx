import { Metadata } from 'next'
import FormulirMasuk from '@/komponen/formulir/FormulirMasuk'
import { Card, CardBody } from '@/komponen/umum/Card'
import LoginFeedback from '@/komponen/autentikasi/LoginFeedback'

export const metadata: Metadata = {
  title: 'Masuk - Dashboard Monitoring',
  description: 'Masuk ke dashboard monitoring server kesehatan',
}

export default function HalamanMasuk() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        <div className="text-center space-y-4">
          <h2 className="text-display-md text-slate-900">
            Masuk ke Dashboard
          </h2>
          <p className="text-body-lg text-slate-600">
            Masukkan kredensial Anda untuk melanjutkan
          </p>
        </div>
        <LoginFeedback />
        <Card glass>
          <CardBody>
            <FormulirMasuk />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}