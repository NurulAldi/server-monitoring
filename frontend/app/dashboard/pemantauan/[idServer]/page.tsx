import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DetailServer from '@/komponen/pemantauan/DetailServer'
import BaganMetrik from '@/komponen/bagan/BaganMetrik'

interface Props {
  params: {
    idServer: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Server ${params.idServer} - Monitoring`,
    description: `Detail monitoring server ${params.idServer}`,
  }
}

export default function HalamanDetailServer({ params }: Props) {
  const { idServer } = params

  // Validasi ID server (dalam implementasi nyata, fetch dari API)
  if (!idServer) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Detail Server: {idServer}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitoring mendalam untuk server ini
          </p>
        </div>

        <div className="space-y-6">
          {/* Informasi Server */}
          <DetailServer idServer={idServer} />

          {/* Bagan Metrik */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Metrik Server
            </h2>
            <BaganMetrik idServer={idServer} />
          </div>
        </div>
      </div>
    </div>
  )
}