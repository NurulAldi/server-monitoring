import { Metadata } from 'next'
import FormulirMasuk from '@/komponen/formulir/FormulirMasuk'

export const metadata: Metadata = {
  title: 'Masuk - Dashboard Monitoring',
  description: 'Masuk ke dashboard monitoring server kesehatan',
}

export default function HalamanMasuk() {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: 'var(--gradient-bg)',
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(157, 78, 221, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(255, 107, 0, 0.1) 0%, transparent 50%)
        `
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-display text-text-primary mb-2 glow-cyan">
            Masuk ke Dashboard
          </h2>
          <p className="text-body text-text-secondary">
            Masukkan kredensial Anda untuk melanjutkan
          </p>
        </div>
        <div className="card">
          <FormulirMasuk />
        </div>
      </div>
    </div>
  )
}