'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useCPUMetrics } from '@/soket/useMetrics'

interface DataCPU {
  waktu: string
  cpu: number
  timestamp: number
}

interface PropsChartCPU {
  serverId?: string
  height?: number
  showRealtime?: boolean
  criticalThreshold?: number
  warningThreshold?: number
}

export function ChartCPU({
  serverId,
  height = 200,
  showRealtime = true,
  criticalThreshold = 90,
  warningThreshold = 80
}: PropsChartCPU) {
  const { data: socketData, currentUsage, isOnline } = useCPUMetrics(serverId)
  const [data, setData] = useState<DataCPU[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0 && showRealtime) {
      // Use real-time data from socket
      setData(prevData => {
        const newData = [...prevData, ...socketData.map(item => ({
          waktu: item.waktu,
          cpu: item.usage,
          timestamp: item.timestamp
        }))]
        // Keep only last 60 data points for performance
        return newData.slice(-60)
      })
    } else if (!showRealtime) {
      // Mock data untuk demo when realtime is disabled
      const mockData: DataCPU[] = []
      const now = Date.now()
      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 1000)
        const baseValue = 20 + Math.random() * 40
        const spike = Math.random() > 0.9 ? Math.random() * 30 : 0
        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          cpu: Math.min(100, baseValue + spike),
          timestamp
        })
      }
      setData(mockData)
    }
  }, [socketData, showRealtime])

  const currentValue = currentUsage || (data.length > 0 ? data[data.length - 1].cpu : 0)
  const isCritical = currentValue >= criticalThreshold
  const isWarning = currentValue >= warningThreshold && !isCritical

  const getGradientColor = () => {
    if (isCritical) return ['#FF4444', '#FF6B6B']
    if (isWarning) return ['#FFD700', '#FFA500']
    return ['#00D4FF', '#9D4EDD']
  }

  const [startColor, endColor] = getGradientColor()

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">CPU Usage</h3>
          <p className="text-body-small text-text-secondary">Real-time utilization</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            'text-status-online'
          }`}>
            {currentValue.toFixed(1)}%
          </div>
          <div className="text-body-small text-text-muted">
            Current
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={startColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={endColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>

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
            stroke="var(--text-secondary)"
            fontSize={11}
            tick={{ fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--bg-border)' }}
            domain={[0, 100]}
            label={{ value: '%', angle: -90, position: 'insideLeft' }}
          />

          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)'
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU']}
          />

          {/* Threshold lines */}
          <ReferenceLine
            y={criticalThreshold}
            stroke="var(--status-critical)"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "var(--status-critical)" }}
          />
          <ReferenceLine
            y={warningThreshold}
            stroke="var(--status-warning)"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "var(--status-warning)" }}
          />

          <Area
            type="monotone"
            dataKey="cpu"
            stroke={startColor}
            strokeWidth={2}
            fill="url(#cpuGradient)"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;{warningThreshold}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Warning ({warningThreshold}-{criticalThreshold}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&gt;{criticalThreshold}%)</span>
          </div>
        </div>

        {showRealtime && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-online animate-pulse"></div>
            <span className="text-text-secondary">Live</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartCPU