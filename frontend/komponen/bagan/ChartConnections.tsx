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
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts'
import { useConnectionMetrics } from '../../soket/useAppMetrics'

interface DataConnections {
  waktu: string
  activeConnections: number
  maxConnections: number
  newConnections: number    // connections per minute
  closedConnections: number // disconnections per minute
  connectionRate: number    // connections per second
  timestamp: number
}

interface PropsChartConnections {
  height?: number
  maxConnections?: number
  showArea?: boolean
  showRate?: boolean
}

export function ChartConnections({
  height = 300,
  maxConnections = 1000,
  showArea = true,
  showRate = false
}: PropsChartConnections) {
  const { data: socketData, currentConnections: socketConnections, isOnline } = useConnectionMetrics()
  const [history, setHistory] = useState<DataConnections[]>([])

  const mockData = useMemo(() => {
    const mock: DataConnections[] = []
    const now = Date.now()

    for (let i = 59; i >= 0; i--) {
      const timestamp = now - (i * 1000) // 1 detik intervals
      const timeOfDay = (timestamp % 86400000) / 3600000 // Hour of day

      // Simulate daily pattern: peak during business hours
      const baseLoad = timeOfDay >= 8 && timeOfDay <= 18 ?
        400 + Math.sin((timeOfDay - 8) * Math.PI / 10) * 300 : // Business hours: 400-700
        100 + Math.random() * 200 // Off hours: 100-300

      const trend = (60 - i) * 2 // Gradual increase over time
      const fluctuation = Math.sin(i * 0.1) * 50 // Sine wave fluctuation
      const spike = Math.random() > 0.95 ? Math.random() * 200 : 0 // Occasional spikes

      const activeConnections = Math.min(maxConnections, Math.max(0, Math.round(baseLoad + trend + fluctuation + spike)))

      // Connection rates
      const newConnections = Math.round((Math.random() * 20 + 5) * (activeConnections / maxConnections + 0.5))
      const closedConnections = Math.round(newConnections * (0.8 + Math.random() * 0.4))
      const connectionRate = Math.round((newConnections - closedConnections + Math.random() * 10 - 5) * 10) / 10

      mock.push({
        waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        activeConnections,
        maxConnections,
        newConnections,
        closedConnections,
        connectionRate,
        timestamp
      })
    }

    return mock
  }, [maxConnections])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      const newPoint = socketData[0]
      setHistory(prev => {
        const last = prev[prev.length - 1]
        // Only add if timestamp is different AND data is different
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

  const currentData = socketConnections || (chartData.length > 0 ? chartData[chartData.length - 1] : null)
  const currentConnections = currentData ? currentData.activeConnections : 0
  const utilizationPercent = (currentConnections / maxConnections) * 100

  const isCritical = utilizationPercent >= 95
  const isWarning = utilizationPercent >= 80 && !isCritical
  const isHigh = utilizationPercent >= 60 && !isWarning

  const formatConnections = useCallback((value: number) => value.toLocaleString(), [])
  const formatRate = useCallback((value: number) => `${value > 0 ? '+' : ''}${value}/s`, [])

  const ChartComponent = showArea ? AreaChart : LineChart

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Active Connections</h3>
          <p className="text-body-small text-text-secondary">Real-time connection monitoring</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            isHigh ? 'text-accent-secondary' :
            'text-status-online'
          }`}>
            {formatConnections(currentConnections)}
          </div>
          <div className="text-body-small text-text-muted">
            Active Now
          </div>
        </div>
      </div>

      {/* Real-time counter display */}
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-accent-primary mb-2 font-mono">
            {formatConnections(currentConnections)}
          </div>
          <div className="text-body-small text-text-secondary mb-1">Active Connections</div>
          <div className="text-sm text-text-muted">
            {utilizationPercent.toFixed(1)}% of {formatConnections(maxConnections)} max
          </div>

          {/* Connection rate indicator */}
          {currentData && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className={`text-lg font-semibold ${
                currentData.connectionRate > 0 ? 'text-status-online' :
                currentData.connectionRate < 0 ? 'text-status-critical' :
                'text-text-secondary'
              }`}>
                {formatRate(currentData.connectionRate)}
              </div>
              <div className="text-body-small text-text-secondary">per second</div>
            </div>
          )}
        </div>
      </div>

      {/* Connections chart */}
      <ResponsiveContainer width="100%" height={height} debounce={1}>
          <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} isAnimationActive={false}>
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
            label={{ value: 'Connections', angle: -90, position: 'insideLeft' }}
            domain={[0, maxConnections]}
          />

          <Tooltip
            contentStyle={{
              background: '#171a20',
              border: '1px solid #393c41',
              borderRadius: '6px',
              color: '#eeeeee'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'activeConnections') return [formatConnections(value), 'Active']
              if (name === 'newConnections') return [formatConnections(value), 'New/min']
              if (name === 'closedConnections') return [formatConnections(value), 'Closed/min']
              if (name === 'connectionRate') return [formatRate(value), 'Rate/sec']
              return [value, name]
            }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            y={maxConnections * 0.95}
            stroke="#e31937"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "#e31937" }}
          />
          <ReferenceLine
            y={maxConnections * 0.8}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "#f7c948" }}
          />
          <ReferenceLine
            y={maxConnections * 0.6}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "High", position: "topRight", fill: "#f7c948" }}
          />

          {/* Connection lines */}
          {showArea ? (
            <Area
              type="monotone"
              dataKey="activeConnections"
              stroke="#00d448"
              fill="#00d448"
              fillOpacity={0.3}
              name="activeConnections"
              isAnimationActive={false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="activeConnections"
              stroke="#00d448"
              strokeWidth={3}
              name="Active Connections"
              dot={false}
              isAnimationActive={false}
            />
          )}

          {/* Connection rate lines (optional) */}
          {showRate && (
            <>
              <Line
                type="monotone"
                dataKey="newConnections"
                stroke="#3e6ae1"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="New Connections"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="closedConnections"
                stroke="#f7c948"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Closed Connections"
                dot={false}
                isAnimationActive={false}
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Connection stats */}
      {currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatConnections(currentData.newConnections)}
            </div>
            <div className="text-body-small text-text-secondary">New/min</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-secondary">
              {formatConnections(currentData.closedConnections)}
            </div>
            <div className="text-body-small text-text-secondary">Closed/min</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-tertiary">
              {formatRate(currentData.connectionRate)}
            </div>
            <div className="text-body-small text-text-secondary">Rate/sec</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-primary">
              {((currentData.activeConnections / maxConnections) * 100).toFixed(1)}%
            </div>
            <div className="text-body-small text-text-secondary">Utilization</div>
          </div>
        </div>
      )}

      {/* Connection health indicator */}
      <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-bg-border">
        <div className="text-body-small text-text-secondary mb-2">
          <strong>Connection Health:</strong>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              currentData && currentData.connectionRate > 0 ? 'bg-status-online' :
              currentData && currentData.connectionRate < -5 ? 'bg-status-critical' :
              'bg-accent-secondary'
            }`}></div>
            <span className="text-body-small text-text-muted">
              {currentData && currentData.connectionRate > 0 ? 'Growing' :
               currentData && currentData.connectionRate < -5 ? 'Declining' :
               'Stable'}
            </span>
          </div>
          <div className="text-body-small text-text-muted">
            Net change: {currentData ? formatRate(currentData.connectionRate) : '0'}/sec
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">High (60-80%)</span>
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

export default ChartConnections