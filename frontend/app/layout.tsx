import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AutentikasiProvider } from '@/kait/AutentikasiProvider'
import { SocketProvider } from '@/soket/SocketProvider'
import ConnectionStatus from '@/komponen/umum/ConnectionStatus'
import FloatingChatButton from '@/komponen/umum/FloatingChatButton'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Server Monitor — Real-Time Infrastructure Insights',
  description: 'Monitor your infrastructure with Tesla-inspired minimalism. Clean, powerful, and built for performance.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <AutentikasiProvider>
          <SocketProvider>
            <main className="min-h-screen">
              {children}
            </main>
            <ConnectionStatus />
            <FloatingChatButton />
          </SocketProvider>
        </AutentikasiProvider>
      </body>
    </html>
  )
}