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

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Server',
    href: '/dashboard/pemantauan',
    icon: Server,
  },
  {
    label: 'Alert',
    href: '/dashboard/peringatan',
    icon: AlertTriangle,
  },
  {
    label: 'Chat AI',
    href: '/dashboard/obrolan',
    icon: MessageSquare,
  },
]

export default function NavigasiSidebar() {
  const pathname = usePathname()
  const { logout } = useAutentikasi()

  return (
    <div className="bg-bg-secondary border-r border-bg-border w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-accent-primary" />
          <div>
            <h2 className="text-heading font-bold text-text-primary">
              Dashboard
            </h2>
            <p className="text-body-small text-text-secondary">
              Monitoring Server
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn('nav-item', isActive && 'active')}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-bg-border">
        <button
          onClick={logout}
          className="nav-item w-full justify-start hover:bg-status-critical/10 hover:text-status-critical"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  )
}