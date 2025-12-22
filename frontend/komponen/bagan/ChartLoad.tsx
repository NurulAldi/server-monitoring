'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts'
import { useLoadMetrics } from '../../soket/useMetrics'

interface DataLoad {
  waktu: string
  load1: number   // 1-minute load average
  load5: number   // 5-minute load average
  load15: number  // 15-minute load average
  cpuCount: number
  loadPercent: number // load1 / cpuCount * 100
  timestamp: number
}

interface PropsChartLoad {
  serverId?: string
  height?: number
  cpuCount?: number
  showArea?: boolean
}

export function ChartLoad({
  serverId,
  height = 300,
  cpuCount = 4,
  showArea = false
}: PropsChartLoad) {
  const { data: socketData, currentLoad, isOnline } = useLoadMetrics(serverId)
  const [data, setData] = useState<DataLoad[]>([])
  const [history, setHistory] = useState<DataLoad[]>([])

  const mockData = useMemo(() => {
    const mock: DataLoad[] = []
    const now = Date.now()

      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 5000) // 5 detik intervals
        const baseLoad = 1 + Math.random() * 2 // Base load 1-3
        const trend = Math.sin(i * 0.05) * 0.5 // Slow trend
        const spike = Math.random() > 0.95 ? Math.random() * 3 : 0 // Occasional spikes

        const load1 = Math.max(0, baseLoad + trend + spike)
        const load5 = load1 * 0.8 + Math.random() * 0.4 // Slightly lower and more stable
        const load15 = load5 * 0.9 + Math.random() * 0.2 // Most stable

        mock.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          load1: Math.round(load1 * 100) / 100,
          load5: Math.round(load5 * 100) / 100,
          load15: Math.round(load15 * 100) / 100,
          cpuCount,
          loadPercent: Math.round((load1 / cpuCount) * 100),
          timestamp
        })
      }

    return mock
  }, [cpuCount])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      const newPoint = socketData[0]
      setHistory(prev => {
        const last = prev[prev.length - 1]
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
      setHistory(prev => prev.length > 0 ? [] : prev)
    }
  }, [socketData])

  const chartData = useMemo(() => history.length > 0 ? history : mockData, [history, mockData])
  const currentData = currentLoad || (chartData.length > 0 ? chartData[chartData.length - 1] : null)
  const currentLoadPercent = currentData ? currentData.loadPercent : 0

  const isCritical = currentLoadPercent >= 200 // 2x CPU count
  const isWarning = currentLoadPercent >= 150 && !isCritical
  const isHigh = currentLoadPercent >= 100 && !isWarning

  const formatLoad = useCallback((value: number) => value.toFixed(2), [])

  const ChartComponent = showArea ? AreaChart : LineChart

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">System Load</h3>
          <p className="text-body-small text-text-secondary">Load averages over time</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            isHigh ? 'text-accent-secondary' :
            'text-status-online'
          }`}>
            {currentLoadPercent}%
          </div>
          <div className="text-body-small text-text-muted">
            Load ({cpuCount} CPUs)
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height} debounce={1}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>  
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
            stroke="#8a8d91"
            fontSize={11}
            tick={{ fill: '#8a8d91' }}
            axisLine={{ stroke: '#393c41' }}
            label={{ value: 'Load', angle: -90, position: 'insideLeft' }}
            domain={[0, 'dataMax + 1']}
          />

          <Tooltip
            contentStyle={{
              background: '#171a20',
              border: '1px solid #393c41',
              borderRadius: '6px',
              color: '#eeeeee'
            }}
            formatter={(value: number, name: string) => {
              return [formatLoad(value), name]
            }}
          />

          <Legend
            wrapperStyle={{ color: '#8a8d91' }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            y={cpuCount * 2}
            stroke="#e31937"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "#e31937" }}
          />
          <ReferenceLine
            y={cpuCount * 1.5}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "#f7c948" }}
          />
          <ReferenceLine
            y={cpuCount}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "High", position: "topRight", fill: "#f7c948" }}
          />

          {/* Load lines */}
          {showArea ? (
            <>
              <Area
                type="monotone"
                dataKey="load15"
                stackId="1"
                stroke="#8a8d91"
                fill="#8a8d91"
                fillOpacity={0.1}
                name="15-min"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="load5"
                stackId="1"
                stroke="#3e6ae1"
                fill="#3e6ae1"
                fillOpacity={0.2}
                name="5-min"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="load1"
                stackId="1"
                stroke="#00d448"
                fill="#00d448"
                fillOpacity={0.3}
                name="1-min"
                isAnimationActive={false}
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="load1"
                stroke="#00d448"
                strokeWidth={3}
                name="1-min"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="load5"
                stroke="#3e6ae1"
                strokeWidth={2}
                name="5-min"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="load15"
                stroke="#8a8d91"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="15-min"
                dot={false}
                isAnimationActive={false}
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Load stats */}
      {currentData && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatLoad(currentData.load1)}
            </div>
            <div className="text-body-small text-text-secondary">1-min</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-tertiary">
              {formatLoad(currentData.load5)}
            </div>
            <div className="text-body-small text-text-secondary">5-min</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-primary">
              {formatLoad(currentData.load15)}
            </div>
            <div className="text-body-small text-text-secondary">15-min</div>
          </div>
        </div>
      )}

      {/* Load explanation */}
      <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-bg-border">
        <div className="text-body-small text-text-secondary mb-2">
          <strong>Load Average:</strong> Number of processes waiting for CPU time
        </div>
        <div className="text-body-small text-text-muted">
          • 1-min: Current activity level<br/>
          • 5-min: Trend over last 5 minutes<br/>
          • 15-min: Long-term trend over last 15 minutes
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;{cpuCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">High ({cpuCount}-{cpuCount * 1.5})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Warning ({cpuCount * 1.5}-{cpuCount * 2})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&gt;{cpuCount * 2})</span>
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

export default ChartLoad