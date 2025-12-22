'use client'

export default function LaporanMetrik() {
  // TODO: Fetch data laporan metrik dari API
  const dataLaporan = {
    totalServer: 5,
    rataRataCpu: 45.2,
    rataRataMemori: 62.8,
    rataRataDisk: 34.1,
    totalAlert: 23,
    uptimeRataRata: 98.5,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-500 mb-2">Total Server</h4>
          <p className="text-display-lg font-bold text-high-contrast">{dataLaporan.totalServer}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-500 mb-2">CPU Rata-rata (%)</h4>
          <p className="text-display-lg font-bold text-accent-blue">{dataLaporan.rataRataCpu}%</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-500 mb-2">Memori Rata-rata (%)</h4>
          <p className="text-display-lg font-bold text-status-online">{dataLaporan.rataRataMemori}%</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-500 mb-2">Disk Rata-rata (%)</h4>
          <p className="text-display-lg font-bold text-warning-amber">{dataLaporan.rataRataDisk}%</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-500 mb-2">Total Alert</h4>
          <p className="text-display-lg font-bold text-accent-red">{dataLaporan.totalAlert}</p>
        </div>

        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <h4 className="text-body-sm font-medium text-neutral-500 mb-2">Uptime Rata-rata (%)</h4>
          <p className="text-display-lg font-bold text-status-online">{dataLaporan.uptimeRataRata}%</p>
        </div>
      </div>

      <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
        <h4 className="text-heading-md font-medium text-high-contrast mb-4">Detail per Server</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-data-label font-medium text-neutral-400">Server</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPU Avg</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mem Avg</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disk Avg</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uptime</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Alert</th>
              </tr>
            </thead>
            <tbody className="bg-deep-grey divide-y divide-neutral-700">
              <tr>
                <td className="px-4 py-2 text-sm">Web Server 1</td>
                <td className="px-4 py-2 text-sm">45%</td>
                <td className="px-4 py-2 text-sm">67%</td>
                <td className="px-4 py-2 text-sm">23%</td>
                <td className="px-4 py-2 text-sm">99.8%</td>
                <td className="px-4 py-2 text-sm">2</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">Database Server</td>
                <td className="px-4 py-2 text-sm">78%</td>
                <td className="px-4 py-2 text-sm">89%</td>
                <td className="px-4 py-2 text-sm">45%</td>
                <td className="px-4 py-2 text-sm">98.2%</td>
                <td className="px-4 py-2 text-sm">5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}