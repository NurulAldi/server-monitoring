'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import { useNetworkMetrics } from '../../soket/useMetrics'

interface DataNetwork {
  waktu: string
  upload: number    // Mbps
  download: number  // Mbps
  total: number     // Mbps
  packetsIn: number
  packetsOut: number
  errors: number
  timestamp: number
}

interface PropsChartNetwork {
  serverId?: string
  height?: number
  maxBandwidth?: number
  showPackets?: boolean
  showErrors?: boolean
}

export function ChartNetwork({
  serverId,
  height = 300,
  maxBandwidth = 1000, // 1 Gbps
  showPackets = false,
  showErrors = false
}: PropsChartNetwork) {
  const { data: socketData, currentNetwork, isOnline } = useNetworkMetrics(serverId)
  const [data, setData] = useState<DataNetwork[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataNetwork[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        upload: item.upload || 0,
        download: item.download || 0,
        total: (item.upload || 0) + (item.download || 0),
        packetsIn: item.packetsIn || 0,
        packetsOut: item.packetsOut || 0,
        errors: item.errors || 0,
        timestamp: item.timestamp
      }))
      setData(transformedData)
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataNetwork[] = []
      const now = Date.now()

      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 2000) // 2 detik intervals
        const baseUpload = 10 + Math.random() * 50
        const baseDownload = 50 + Math.random() * 200
        const spike = Math.random() > 0.95 ? Math.random() * 300 : 0

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          upload: Math.min(maxBandwidth, baseUpload + spike * 0.3),
          download: Math.min(maxBandwidth, baseDownload + spike),
          total: 0, // akan dihitung
          packetsIn: Math.floor(Math.random() * 1000) + 500,
          packetsOut: Math.floor(Math.random() * 800) + 300,
          errors: Math.random() > 0.9 ? Math.floor(Math.random() * 10) : 0,
          timestamp
        })
      }

      // Hitung total bandwidth
      mockData.forEach(item => {
        item.total = item.upload + item.download
      })

      setData(mockData)
    }
  }, [socketData, maxBandwidth])

  const currentData = currentNetwork || (data.length > 0 ? data[data.length - 1] : null)
  const currentUtilization = currentData ? (currentData.total / maxBandwidth * 100) : 0

  const isCritical = currentUtilization >= 95
  const isWarning = currentUtilization >= 80 && !isCritical

  const formatBandwidth = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(2)} Gbps`
    if (value >= 1) return `${value.toFixed(1)} Mbps`
    return `${(value * 1000).toFixed(0)} Kbps`
  }

  const formatPackets = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Network I/O</h3>
          <p className="text-body-small text-text-secondary">Bandwidth utilization</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            'text-status-online'
          }`}>
            {currentUtilization.toFixed(1)}%
          </div>
          <div className="text-body-small text-text-muted">
            Utilization
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--data-grid)"
            opacity={0.3}
          />

          <XAxis
            dataKey="waktu"
            stroke="var(--text-secondary)"
            fontSize={11}
            tick={{ fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--bg-border)' }}
          />

          <YAxis
            yAxisId="bandwidth"
            orientation="left"
            stroke="var(--text-secondary)"
            fontSize={11}
            tick={{ fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--bg-border)' }}
            label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
            domain={[0, maxBandwidth]}
          />

          {showPackets && (
            <YAxis
              yAxisId="packets"
              orientation="right"
              stroke="var(--accent-tertiary)"
              fontSize={11}
              tick={{ fill: 'var(--accent-tertiary)' }}
              axisLine={{ stroke: 'var(--bg-border)' }}
              label={{ value: 'Packets/s', angle: 90, position: 'insideRight' }}
            />
          )}

          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Upload' || name === 'Download') {
                return [formatBandwidth(value), name]
              }
              if (name === 'Packets In' || name === 'Packets Out') {
                return [formatPackets(value), name]
              }
              return [value, name]
            }}
          />

          <Legend
            wrapperStyle={{ color: 'var(--text-secondary)' }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            yAxisId="bandwidth"
            y={maxBandwidth * 0.95}
            stroke="var(--status-critical)"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "var(--status-critical)" }}
          />
          <ReferenceLine
            yAxisId="bandwidth"
            y={maxBandwidth * 0.8}
            stroke="var(--status-warning)"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "var(--status-warning)" }}
          />

          {/* Bandwidth lines */}
          <Line
            yAxisId="bandwidth"
            type="monotone"
            dataKey="download"
            stroke="#00FF88"
            strokeWidth={2}
            name="Download"
            dot={false}
            animationDuration={300}
          />
          <Line
            yAxisId="bandwidth"
            type="monotone"
            dataKey="upload"
            stroke="#FF6B00"
            strokeWidth={2}
            name="Upload"
            dot={false}
            animationDuration={300}
          />

          {/* Packet lines (optional) */}
          {showPackets && (
            <>
              <Line
                yAxisId="packets"
                type="monotone"
                dataKey="packetsIn"
                stroke="#9D4EDD"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Packets In"
                dot={false}
                animationDuration={300}
              />
              <Line
                yAxisId="packets"
                type="monotone"
                dataKey="packetsOut"
                stroke="#00D4FF"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Packets Out"
                dot={false}
                animationDuration={300}
              />
            </>
          )}

          {/* Error indicators */}
          {showErrors && data.map((item, index) => (
            item.errors > 0 && (
              <ReferenceLine
                key={`error-${index}`}
                x={item.waktu}
                stroke="var(--status-critical)"
                strokeWidth={3}
                label={{ value: "ERR", position: "top", fill: "var(--status-critical)" }}
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Network stats */}
      {currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatBandwidth(currentData.download)}
            </div>
            <div className="text-body-small text-text-secondary">Download</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-secondary">
              {formatBandwidth(currentData.upload)}
            </div>
            <div className="text-body-small text-text-secondary">Upload</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-primary">
              {formatPackets(currentData.packetsIn)}
            </div>
            <div className="text-body-small text-text-secondary">Packets In</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-tertiary">
              {formatPackets(currentData.packetsOut)}
            </div>
            <div className="text-body-small text-text-secondary">Packets Out</div>
          </div>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Warning (80-95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&gt;95%)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-status-online animate-pulse' : 'bg-status-offline'}`}></div>
          <span className="text-text-secondary">{isOnline ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </div>
  )
}

export default ChartNetwork