'use client'

import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'

interface PropsDetailServer {
  idServer: string
}

export default function DetailServer({ idServer }: PropsDetailServer) {
  // TODO: Fetch data server berdasarkan ID
  const dataServer = {
    id: idServer,
    nama: 'Web Server 1',
    status: 'online',
    ip: '192.168.1.100',
    os: 'Ubuntu 22.04 LTS',
    cpu: {
      penggunaan: 45,
      model: 'Intel Xeon E5-2680',
      core: 8,
    },
    memori: {
      total: '16 GB',
      digunakan: '10.7 GB',
      persen: 67,
    },
    disk: {
      total: '500 GB',
      digunakan: '115 GB',
      persen: 23,
    },
    uptime: '15 hari 4 jam 32 menit',
    lastUpdate: '2 menit yang lalu',
  }

  return (
    <Kartu>
      <HeaderKartu>
        <JudulKartu>Informasi Server: {dataServer.nama}</JudulKartu>
      </HeaderKartu>
      <KontenKartu>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-body-sm font-medium text-slate-600 mb-2">Status</h4>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                dataServer.status === 'online'
                  ? 'text-green-600 bg-green-100'
                  : 'text-red-600 bg-red-100'
              }`}
            >
              {dataServer.status.toUpperCase()}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">IP Address</h4>
            <p className="text-sm">{dataServer.ip}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Sistem Operasi</h4>
            <p className="text-sm">{dataServer.os}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">CPU</h4>
            <p className="text-sm">{dataServer.cpu.penggunaan}% digunakan</p>
            <p className="text-xs text-gray-500">{dataServer.cpu.model} ({dataServer.cpu.core} core)</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Memori</h4>
            <p className="text-sm">{dataServer.memori.digunakan} / {dataServer.memori.total} ({dataServer.memori.persen}%)</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Disk</h4>
            <p className="text-sm">{dataServer.disk.digunakan} / {dataServer.disk.total} ({dataServer.disk.persen}%)</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Uptime</h4>
            <p className="text-sm">{dataServer.uptime}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Terakhir Update</h4>
            <p className="text-sm">{dataServer.lastUpdate}</p>
          </div>
        </div>
      </KontenKartu>
    </Kartu>
  )
}