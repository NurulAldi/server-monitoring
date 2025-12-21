import { Metadata } from 'next'
import NavigasiSidebarAdmin from '@/komponen/umum/NavigasiSidebarAdmin'

export const metadata: Metadata = {
  title: 'Admin Panel - Monitoring Server',
  description: 'Panel administrasi sistem monitoring server',
}

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigasiSidebarAdmin />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}