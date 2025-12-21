'use client'

import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'

interface PropsBaganMetrik {
  idServer: string
}

export default function BaganMetrik({ idServer }: PropsBaganMetrik) {
  // TODO: Implementasi bagan menggunakan Recharts
  return (
    <Kartu>
      <HeaderKartu>
        <JudulKartu>Metrik Server {idServer}</JudulKartu>
      </HeaderKartu>
      <KontenKartu>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Bagan metrik akan diimplementasikan dengan Recharts</p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">CPU Usage (24h)</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-blue-500 rounded-b" style={{ height: '45%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 45%</p>
          </div>

          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Memory Usage (24h)</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-green-500 rounded-b" style={{ height: '67%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 67%</p>
          </div>

          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Disk Usage (24h)</h4>
            <div className="mt-2 h-32 bg-gray-100 rounded flex items-end justify-center">
              <div className="w-full bg-yellow-500 rounded-b" style={{ height: '23%' }}></div>
            </div>
            <p className="mt-1 text-sm">Rata-rata: 23%</p>
          </div>
        </div>
      </KontenKartu>
    </Kartu>
  )
}