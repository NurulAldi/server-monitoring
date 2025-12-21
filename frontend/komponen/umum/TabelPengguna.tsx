'use client'

import { Tombol } from '@/komponen/umum/Tombol'

interface Pengguna {
  id: string
  nama: string
  email: string
  jabatan: string
  status: 'aktif' | 'nonaktif'
  terakhirLogin: string
}

export default function TabelPengguna() {
  // TODO: Fetch data pengguna dari API
  const dataPengguna: Pengguna[] = [
    {
      id: '1',
      nama: 'Admin User',
      email: 'admin@example.com',
      jabatan: 'Administrator',
      status: 'aktif',
      terakhirLogin: '2024-01-15 10:30:00',
    },
    {
      id: '2',
      nama: 'Operator Server',
      email: 'operator@example.com',
      jabatan: 'Operator',
      status: 'aktif',
      terakhirLogin: '2024-01-14 16:45:00',
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jabatan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Terakhir Login
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dataPengguna.map((pengguna) => (
            <tr key={pengguna.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {pengguna.nama}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pengguna.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pengguna.jabatan}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pengguna.status === 'aktif'
                      ? 'text-green-600 bg-green-100'
                      : 'text-red-600 bg-red-100'
                  }`}
                >
                  {pengguna.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pengguna.terakhirLogin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <Tombol variant="outline" size="sm">
                    Edit
                  </Tombol>
                  <Tombol variant="destructive" size="sm">
                    Hapus
                  </Tombol>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}