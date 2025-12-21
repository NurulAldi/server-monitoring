'use client'

import Link from 'next/link'
import { Server, Cpu, HardDrive, Wifi } from 'lucide-react'
import { Kartu, HeaderKartu, KontenKartu, FooterKartu } from '@/komponen/umum/Kartu'
import StatusIndicator from '@/komponen/umum/StatusIndicator'
import { cn } from '@/utilitas/cn'

interface ServerData {
  id: string
  nama: string
  alamatIP: string
  status: 'online' | 'warning' | 'critical' | 'offline'
  cpu: number
  memory: number
  disk: number
  network: number
  lastUpdate: string
}

interface PropsKartuServer {
  server: ServerData
  className?: string
}

export function KartuServer({ server, className }: PropsKartuServer) {
  const statusClasses = {
    online: 'status-card-online',
    warning: 'status-card-warning',
    critical: 'status-card-critical',
    offline: 'status-card-offline',
  }

  return (
    <Link href={`/dashboard/pemantauan/${server.id}`}>
      <Kartu className={cn(statusClasses[server.status], 'cursor-pointer', className)}>
        <HeaderKartu>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-text-secondary" />
              <div>
                <h3 className="text-heading font-semibold text-text-primary">
                  {server.nama}
                </h3>
                <p className="text-body-small text-text-muted">
                  {server.alamatIP}
                </p>
              </div>
            </div>
            <StatusIndicator status={server.status} showLabel />
          </div>
        </HeaderKartu>

        <KontenKartu>
          <div className="grid grid-cols-2 gap-4">
            {/* CPU */}
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent-secondary" />
              <div className="flex-1">
                <div className="text-data-label">CPU</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div
                        className={cn(
                          'progress-fill',
                          server.cpu > 80 ? 'critical' : server.cpu > 60 ? 'warning' : ''
                        )}
                        style={{ width: `${server.cpu}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-body-small text-text-primary">
                    {server.cpu}%
                  </span>
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent-tertiary" />
              <div className="flex-1">
                <div className="text-data-label">Memory</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div
                        className={cn(
                          'progress-fill',
                          server.memory > 80 ? 'critical' : server.memory > 60 ? 'warning' : ''
                        )}
                        style={{ width: `${server.memory}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-body-small text-text-primary">
                    {server.memory}%
                  </span>
                </div>
              </div>
            </div>

            {/* Disk */}
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent-primary" />
              <div className="flex-1">
                <div className="text-data-label">Disk</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div
                        className={cn(
                          'progress-fill',
                          server.disk > 80 ? 'critical' : server.disk > 60 ? 'warning' : ''
                        )}
                        style={{ width: `${server.disk}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-body-small text-text-primary">
                    {server.disk}%
                  </span>
                </div>
              </div>
            </div>

            {/* Network */}
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-accent-secondary" />
              <div className="flex-1">
                <div className="text-data-label">Network</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div
                        className={cn(
                          'progress-fill',
                          server.network > 80 ? 'critical' : server.network > 60 ? 'warning' : ''
                        )}
                        style={{ width: `${server.network}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-body-small text-text-primary">
                    {server.network}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </KontenKartu>

        <FooterKartu>
          <div className="flex items-center justify-between text-body-small text-text-muted">
            <span>Updated {server.lastUpdate}</span>
            <span className="text-accent-primary hover:text-accent-primary/80">
              View Details →
            </span>
          </div>
        </FooterKartu>
      </Kartu>
    </Link>
  )
}

export default KartuServer