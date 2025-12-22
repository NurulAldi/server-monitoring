'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
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
  const [history, setHistory] = useState<DataNetwork[]>([])

  const mockData = useMemo(() => {
    const mock: DataNetwork[] = []
    const now = Date.now()

    for (let i = 59; i >= 0; i--) {
      const timestamp = now - (i * 2000) // 2 detik intervals
      const baseUpload = 10 + Math.random() * 50
      const baseDownload = 50 + Math.random() * 200
      const spike = Math.random() > 0.95 ? Math.random() * 300 : 0

      mock.push({
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
    mock.forEach(item => {
      item.total = item.upload + item.download
    })

    return mock
  }, [maxBandwidth])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Add new data point to history
      const newPoint = socketData[0] // since socketData is [current]
      setHistory(prev => {
        const last = prev[prev.length - 1]
        // Only add if timestamp is different (prevent duplicates)
        if (!last || last.timestamp !== newPoint.timestamp) {
          const updated = [...prev, newPoint].slice(-60)
          // Deep equality check
          if (JSON.stringify(prev) !== JSON.stringify(updated)) {
            return updated
          }
        }
        return prev
      })
    } else {
      // Fallback ke mock data jika socket offline
      setHistory(prev => prev.length > 0 ? [] : prev)
    }
  }, [socketData])

  const chartData = useMemo(() => history.length > 0 ? history : mockData, [history, mockData])

  const currentData = currentNetwork || (chartData.length > 0 ? chartData[chartData.length - 1] : null)
  const currentUtilization = currentData ? (currentData.total / maxBandwidth * 100) : 0

  const isCritical = currentUtilization >= 95
  const isWarning = currentUtilization >= 80 && !isCritical

  const formatBandwidth = useCallback((value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(2)} Gbps`
    if (value >= 1) return `${value.toFixed(1)} Mbps`
    return `${(value * 1000).toFixed(0)} Kbps`
  }, [])

  const formatPackets = useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }, [])

  const tooltipFormatter = useCallback((value: number, name: string) => {
    if (name === 'Upload' || name === 'Download') {
      return [formatBandwidth(value), name]
    }
    if (name === 'Packets In' || name === 'Packets Out') {
      return [formatPackets(value), name]
    }
    return [value, name]
  }, [formatBandwidth, formatPackets])

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

      <ResponsiveContainer width="100%" height={height} debounce={1}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} isAnimationActive={false}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#393c41"
            opacity={0.3}
          />

          <XAxis
            dataKey="waktu"
            stroke="#8a8d91"
            fontSize={11}
            tick={{ fill: '#8a8d91' }}
            axisLine={{ stroke: '#393c41' }}
          />

          <YAxis
            yAxisId="bandwidth"
            orientation="left"
            stroke="#8a8d91"
            fontSize={11}
            tick={{ fill: '#8a8d91' }}
            axisLine={{ stroke: '#393c41' }}
            label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
            domain={[0, maxBandwidth]}
          />

          {showPackets && (
            <YAxis
              yAxisId="packets"
              orientation="right"
              stroke="#3e6ae1"
              fontSize={11}
              tick={{ fill: '#3e6ae1' }}
              axisLine={{ stroke: '#393c41' }}
              label={{ value: 'Packets/s', angle: 90, position: 'insideRight' }}
            />
          )}

          <Tooltip
            contentStyle={{
              background: '#171a20',
              border: '1px solid #393c41',
              borderRadius: '6px',
              color: '#eeeeee'
            }}
            formatter={tooltipFormatter}
          />

          <Legend
            wrapperStyle={{ color: '#8a8d91' }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            yAxisId="bandwidth"
            y={maxBandwidth * 0.95}
            stroke="#e31937"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "#e31937" }}
          />
          <ReferenceLine
            yAxisId="bandwidth"
            y={maxBandwidth * 0.8}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "#f7c948" }}
          />

          {/* Bandwidth lines */}
          <Line
            yAxisId="bandwidth"
            type="monotone"
            dataKey="download"
            stroke="#00d448"
            strokeWidth={2}
            name="Download"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="bandwidth"
            type="monotone"
            dataKey="upload"
            stroke="#f7c948"
            strokeWidth={2}
            name="Upload"
            dot={false}
            isAnimationActive={false}
          />

          {/* Packet lines */}
          {showPackets && (
            <>
              <Line
                yAxisId="packets"
                type="monotone"
                dataKey="packetsIn"
                stroke="#8a8d91"
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
                stroke="#3e6ae1"
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
                stroke="#e31937"
                strokeWidth={3}
                label={{ value: "ERR", position: "top", fill: "#e31937" }}
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