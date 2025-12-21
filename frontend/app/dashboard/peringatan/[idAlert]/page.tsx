import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DetailAlert from '@/komponen/peringatan/DetailAlert'
import RiwayatAlert from '@/komponen/peringatan/RiwayatAlert'

interface Props {
  params: {
    idAlert: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Alert ${params.idAlert} - Monitoring`,
    description: `Detail alert ${params.idAlert}`,
  }
}

export default function HalamanDetailAlert({ params }: Props) {
  const { idAlert } = params

  // Validasi ID alert (dalam implementasi nyata, fetch dari API)
  if (!idAlert) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Detail Alert: {idAlert}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Informasi lengkap tentang alert ini
          </p>
        </div>

        <div className="space-y-6">
          {/* Detail Alert */}
          <DetailAlert idAlert={idAlert} />

          {/* Riwayat Alert Serupa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Riwayat Alert Serupa
            </h2>
            <RiwayatAlert idAlert={idAlert} />
          </div>
        </div>
      </div>
    </div>
  )
}