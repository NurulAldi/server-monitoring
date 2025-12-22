'use client'

export default function LaporanAlert() {
  // TODO: Fetch data laporan alert dari API
  const dataLaporan = {
    totalAlert: 23,
    alertKritis: 5,
    alertPeringatan: 12,
    alertInfo: 6,
    alertResolved: 18,
    alertActive: 5,
  }

  const dataAlertDetail = [
    {
      server: 'API Server',
      jenis: 'CPU High',
      tingkat: 'Kritis',
      frekuensi: 3,
      rataRataDurasi: '45 menit',
      terakhirTerjadi: '2024-01-15 14:30:00',
    },
    {
      server: 'Database Server',
      jenis: 'Memory High',
      tingkat: 'Peringatan',
      frekuensi: 5,
      rataRataDurasi: '120 menit',
      terakhirTerjadi: '2024-01-14 16:45:00',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-400 mb-2">Total Alert</h4>
          <p className="text-display-lg font-bold text-high-contrast">{dataLaporan.totalAlert}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-400 mb-2">Alert Kritis</h4>
          <p className="text-display-lg font-bold text-accent-red">{dataLaporan.alertKritis}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-400 mb-2">Alert Peringatan</h4>
          <p className="text-display-lg font-bold text-warning-amber">{dataLaporan.alertPeringatan}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-400 mb-2">Alert Info</h4>
          <p className="text-display-lg font-bold text-accent-blue">{dataLaporan.alertInfo}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-400 mb-2">Alert Resolved</h4>
          <p className="text-display-lg font-bold text-status-online">{dataLaporan.alertResolved}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-400 mb-2">Alert Active</h4>
          <p className="text-display-lg font-bold text-warning-amber">{dataLaporan.alertActive}</p>
        </div>
      </div>

      <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
        <h4 className="text-heading-md font-medium text-high-contrast mb-4">Detail Alert per Jenis</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-400">Server</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jenis Alert</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tingkat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frekuensi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rata-rata Durasi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Terakhir Terjadi</th>
              </tr>
            </thead>
            <tbody className="bg-deep-grey divide-y divide-neutral-700">
              {dataAlertDetail.map((alert, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm">{alert.server}</td>
                  <td className="px-4 py-2 text-sm">{alert.jenis}</td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.tingkat === 'Kritis'
                          ? 'text-red-600 bg-red-100'
                          : 'text-yellow-600 bg-yellow-100'
                      }`}
                    >
                      {alert.tingkat}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{alert.frekuensi}x</td>
                  <td className="px-4 py-2 text-sm">{alert.rataRataDurasi}</td>
                  <td className="px-4 py-2 text-sm">{alert.terakhirTerjadi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}