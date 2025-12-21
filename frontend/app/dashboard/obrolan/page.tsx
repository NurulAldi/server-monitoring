import { Metadata } from 'next'
import ObrolanAI from '@/komponen/obrolan/ObrolanAI'

export const metadata: Metadata = {
  title: 'Obrolan AI - Dashboard Monitoring',
  description: 'Chat dengan AI untuk bantuan monitoring server',
}

export default function HalamanObrolan() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Obrolan AI</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tanyakan apa saja tentang status server dan monitoring
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <ObrolanAI />
        </div>
      </div>
    </div>
  )
}