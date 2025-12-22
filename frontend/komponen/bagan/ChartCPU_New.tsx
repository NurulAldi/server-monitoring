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
      setData(prevData => {
        const newData = [...prevData, ...socketData.map(item => ({
          waktu: item.waktu,
          cpu: item.usage,
          timestamp: item.timestamp
        }))]
        return newData.slice(-60)
      })
    } else if (!showRealtime) {
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
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
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
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>

      <StatusLegend />
    </ChartWrapper>
  )
}

export default ChartCPU
