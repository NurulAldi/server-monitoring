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
    <div className="bg-pure-black border-r border-neutral-700 w-64 min-h-screen glass">
      <div className="p-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-accent-blue mr-3" />
          <div>
            <h2 className="text-display-md font-semibold text-high-contrast">
              Admin Panel
            </h2>
            <p className="text-body-sm text-neutral-500">Monitoring Server</p>
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
                    'flex items-center px-4 py-3 text-body font-medium rounded-pill transition-smooth',
                    isActive
                      ? 'bg-accent-blue/10 text-accent-blue border-r-4 border-accent-blue'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-high-contrast'
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

      <div className="absolute bottom-0 w-64 p-4 border-t border-neutral-700">
        <div className="mb-4">
          <p className="text-body-sm text-neutral-400">
            Masuk sebagai: <span className="font-medium text-high-contrast">{pengguna?.nama}</span>
          </p>
          <p className="text-body-sm text-neutral-500">{pengguna?.email}</p>
        </div>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center w-full px-4 py-2.5 text-body font-medium text-neutral-400 rounded-pill hover:bg-neutral-800 hover:text-high-contrast transition-smooth"
          >
            Kembali ke Dashboard
          </Link>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2.5 text-body font-medium text-neutral-400 rounded-pill hover:bg-neutral-800 hover:text-high-contrast transition-smooth"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}