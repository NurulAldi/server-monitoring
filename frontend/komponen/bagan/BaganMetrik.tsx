'use client'

import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'

interface PropsBaganMetrik {
  idServer: string
}

export default function BaganMetrik({ idServer }: PropsBaganMetrik) {
  // SIMPLIFIED: Only 4 core metrics
  return (
    <Kartu>
      <HeaderKartu>
        <JudulKartu>Core Metrics - Server {idServer}</JudulKartu>
      </HeaderKartu>
      <KontenKartu>
        <div className="h-64 flex items-center justify-center bg-neutral-800 rounded-xl">
          <p className="text-gray-500">Bagan metrik akan diimplementasikan dengan Recharts</p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">CPU Usage</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-blue-500 rounded-b" style={{ height: '45%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 45%</p>
          </div>

          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">RAM Usage</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-green-500 rounded-b" style={{ height: '67%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 67%</p>
          </div>

          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Disk Usage</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-yellow-500 rounded-b" style={{ height: '23%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 23%</p>
          </div>

          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Temperature</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-red-500 rounded-b" style={{ height: '55%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 55°C</p>
          </div>
        </div>
      </KontenKartu>
    </Kartu>
  )
}