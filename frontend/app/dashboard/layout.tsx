import { Metadata } from 'next'
import NavigasiSidebar from '@/komponen/umum/NavigasiSidebar'

export const metadata: Metadata = {
  title: 'Dashboard - Monitoring Server',
  description: 'Dashboard monitoring kesehatan server',
}

export default function LayoutDashboard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigasiSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}