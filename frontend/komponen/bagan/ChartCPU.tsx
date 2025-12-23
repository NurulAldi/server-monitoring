'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useCPUMetrics } from '@/soket/useMetrics'
import { teslaChartTheme, getStatusColor } from '@/utilitas/chartTheme'
import { ChartWrapper, StatusLegend } from './ChartWrapper'

interface DataCPU {
  waktu: string
  cpu: number
  timestamp: number
}

interface PropsChartCPU {
  serverId?: string
  showRealtime?: boolean
  criticalThreshold?: number
  warningThreshold?: number
}

export function ChartCPU({
  serverId,
  showRealtime = true,
  criticalThreshold = 90,
  warningThreshold = 80
}: PropsChartCPU) {
  const { data: socketData, currentUsage, isOnline } = useCPUMetrics(serverId)
  const [data, setData] = useState<DataCPU[]>([])

  const mockData = useMemo(() => {
    const mock: DataCPU[] = []
    const now = Date.now()
    for (let i = 59; i >= 0; i--) {
      const timestamp = now - (i * 1000)
      const baseValue = 20 + Math.random() * 40
      const spike = Math.random() > 0.9 ? Math.random() * 30 : 0
      mock.push({
        waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        cpu: Math.min(100, baseValue + spike),
        timestamp
      })
    }
    return mock
  }, [])

  useEffect(() => {
    if (socketData && socketData.length > 0 && showRealtime) {
      setData(prevData => {
        const newPoint = socketData[0]
        const last = prevData[prevData.length - 1]
        if (!last || last.timestamp !== newPoint.timestamp) {
          const point = {
            waktu: newPoint.waktu,
            cpu: newPoint.usage,
            timestamp: newPoint.timestamp
          }
          const updated = [...prevData, point].slice(-60)
          // Deep equality check
          if (JSON.stringify(prevData) !== JSON.stringify(updated)) {
            return updated
          }
        }
        return prevData
      })
    } else if (!showRealtime && data.length === 0) {
      setData(mockData)
    } else if (socketData && socketData.length === 0 && data.length === 0) {
      // No data available, show empty state
      setData([])
    }
  }, [socketData, showRealtime, mockData, data.length])

  const currentValue = currentUsage || (data.length > 0 ? data[data.length - 1].cpu : 0)
  const statusColor = getStatusColor(currentValue, warningThreshold, criticalThreshold)

  return (
    <ChartWrapper
      title="CPU Usage"
      subtitle="Real-time utilization"
      currentValue={currentValue}
      unit="%"
      statusColor={statusColor}
      isLive={showRealtime && isOnline}
    >
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Loading...</div>
            <div className="text-sm">Fetching CPU metrics</div>
          </div>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
            <AreaChart data={data} animationDuration={0} isAnimationActive={false}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={statusColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={statusColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid {...teslaChartTheme.grid} vertical={false} />

            <XAxis
              dataKey="waktu"
              {...teslaChartTheme.axis.tick}
              axisLine={teslaChartTheme.axis.axisLine}
              tickLine={false}
            />

            <YAxis
              {...teslaChartTheme.axis.tick}
              axisLine={teslaChartTheme.axis.axisLine}
              tickLine={false}
              domain={[0, 100]}
            />

            <Tooltip
              contentStyle={teslaChartTheme.tooltip.contentStyle}
              labelStyle={teslaChartTheme.tooltip.labelStyle}
              itemStyle={teslaChartTheme.tooltip.itemStyle}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU']}
            />

            <Area
              type="monotone"
              dataKey="cpu"
              stroke={statusColor}
              strokeWidth={2}
              fill="url(#cpuGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      )}

      <StatusLegend />
    </ChartWrapper>
  )
}

export default ChartCPU
