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
  const [data, setData] = useState<DataConnections[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataConnections[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        activeConnections: item.activeConnections || 0,
        maxConnections: item.maxConnections || maxConnections,
        newConnections: item.newConnections || 0,
        closedConnections: item.closedConnections || 0,
        connectionRate: item.connectionRate || 0,
        timestamp: item.timestamp
      }))
      setData(transformedData)
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataConnections[] = []
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

        mockData.push({
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

      setData(mockData)
    }
  }, [socketData, maxConnections])

  const currentData = socketConnections || (data.length > 0 ? data[data.length - 1] : null)
  const currentConnections = currentData ? currentData.activeConnections : 0
  const utilizationPercent = (currentConnections / maxConnections) * 100

  const isCritical = utilizationPercent >= 95
  const isWarning = utilizationPercent >= 80 && !isCritical
  const isHigh = utilizationPercent >= 60 && !isWarning

  const formatConnections = (value: number) => value.toLocaleString()
  const formatRate = (value: number) => `${value > 0 ? '+' : ''}${value}/s`

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
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            label={{ value: 'Connections', angle: -90, position: 'insideLeft' }}
            domain={[0, maxConnections]}
          />

          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)'
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
            stroke="var(--status-critical)"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "var(--status-critical)" }}
          />
          <ReferenceLine
            y={maxConnections * 0.8}
            stroke="var(--status-warning)"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "var(--status-warning)" }}
          />
          <ReferenceLine
            y={maxConnections * 0.6}
            stroke="var(--accent-secondary)"
            strokeDasharray="5 5"
            label={{ value: "High", position: "topRight", fill: "var(--accent-secondary)" }}
          />

          {/* Connection lines */}
          {showArea ? (
            <Area
              type="monotone"
              dataKey="activeConnections"
              stroke="#00FF88"
              fill="#00FF88"
              fillOpacity={0.3}
              name="activeConnections"
              animationDuration={300}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="activeConnections"
              stroke="#00FF88"
              strokeWidth={3}
              name="Active Connections"
              dot={false}
              animationDuration={300}
            />
          )}

          {/* Connection rate lines (optional) */}
          {showRate && (
            <>
              <Line
                type="monotone"
                dataKey="newConnections"
                stroke="#00D4FF"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="New Connections"
                dot={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="closedConnections"
                stroke="#FF6B00"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Closed Connections"
                dot={false}
                animationDuration={300}
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