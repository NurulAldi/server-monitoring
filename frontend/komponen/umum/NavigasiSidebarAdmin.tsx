'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilitas/cn'
import {
  Users,
  Server,
  Settings,
  BarChart3,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAutentikasi } from '@/kait/useAutentikasi'

const menuItems = [
  {
    label: 'Dashboard Admin',
    href: '/admin',
    icon: BarChart3,
  },
  {
    label: 'Kelola Pengguna',
    href: '/admin/pengguna',
    icon: Users,
  },
  {
    label: 'Kelola Server',
    href: '/admin/server',
    icon: Server,
  },
  {
    label: 'Pengaturan Sistem',
    href: '/admin/pengaturan',
    icon: Settings,
  },
]

export default function NavigasiSidebarAdmin() {
  const pathname = usePathname()
  const { logout, pengguna } = useAutentikasi()

  return (
    <div className="bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Panel
            </h2>
            <p className="text-sm text-gray-600">Monitoring Server</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Masuk sebagai: <span className="font-medium">{pengguna?.nama}</span>
          </p>
          <p className="text-xs text-gray-500">{pengguna?.email}</p>
        </div>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}