import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AutentikasiProvider } from '@/kait/AutentikasiProvider'
import { SocketProvider } from '@/soket/SocketProvider'
import ConnectionStatus from '@/komponen/umum/ConnectionStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dashboard Monitoring Server',
  description: 'Sistem monitoring kesehatan server real-time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AutentikasiProvider>
          <SocketProvider>
            {children}
            <ConnectionStatus />
          </SocketProvider>
        </AutentikasiProvider>
      </body>
    </html>
  )
}