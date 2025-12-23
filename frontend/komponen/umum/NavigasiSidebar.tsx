'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilitas/cn'
import {
  Home,
  Server,
  AlertTriangle,
  MessageSquare,
  LogOut,
  Activity,
} from 'lucide-react'
import { useAutentikasi } from '@/kait/useAutentikasi'
import ConfirmDialog from '@/komponen/umum/ConfirmDialog'
import { useState } from 'react'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Keluar',
    icon: LogOut,
    action: 'logout'
  }
]

export default function NavigasiSidebar() {
  const pathname = usePathname()
  const { logout } = useAutentikasi()
  const [konfirmasiTerbuka, setKonfirmasiTerbuka] = useState(false)

  function handleLogoutClick() {
    setKonfirmasiTerbuka(true)
  }

  function handleConfirmLogout() {
    setKonfirmasiTerbuka(false)
    logout()
  }

  function handleCancelLogout() {
    setKonfirmasiTerbuka(false)
  }

  return (
    <div className="bg-white border-r border-slate-200 w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-heading font-bold text-slate-900">
              Dashboard
            </h2>
            <p className="text-body-small text-slate-600">
              Monitoring Server
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href ? pathname === item.href : false

            // If the menu item is an action (logout), render a button instead of a Link
            if (item.action === 'logout') {
              return (
                <li key={item.label}>
                  <button
                    onClick={handleLogoutClick}
                    className={cn('nav-item w-full justify-start', 'hover:bg-red-50 hover:text-red-600')}
                    aria-label="Logout"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              )
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'nav-item',
                    isActive && 'bg-blue-50 text-blue-600 font-semibold'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <ConfirmDialog
        open={konfirmasiTerbuka}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari akun? Anda akan diarahkan ke halaman login."
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </div>
  )
}