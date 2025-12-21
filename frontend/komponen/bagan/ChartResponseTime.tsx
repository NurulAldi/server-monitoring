'use client'

import { useEffect, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  ZAxis
} from 'recharts'
import { useResponseTimeMetrics } from '../../soket/useAppMetrics'

interface DataResponseTime {
  waktu: string
  responseTime: number // ms
  requestCount: number
  errorCount: number
  timestamp: number
  endpoint?: string
}

interface PropsChartResponseTime {
  height?: number
  maxResponseTime?: number
  showScatter?: boolean
  showTrend?: boolean
}

export function ChartResponseTime({
  height = 300,
  maxResponseTime = 5000, // 5 seconds
  showScatter = true,
  showTrend = true
}: PropsChartResponseTime) {
  const { data: socketData, currentResponse, isOnline } = useResponseTimeMetrics()
  const [data, setData] = useState<DataResponseTime[]>([])
  const [trendData, setTrendData] = useState<any[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataResponseTime[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        responseTime: item.responseTime || 0,
        requestCount: item.requestCount || 0,
        errorCount: item.errorCount || 0,
        timestamp: item.timestamp,
        endpoint: item.endpoint
      }))
      setData(transformedData)

      // Calculate trend line
      if (showTrend && transformedData.length > 0) {
        const sorted = [...transformedData].sort((a, b) => a.timestamp - b.timestamp)
        const trend = sorted.map((item, index) => ({
          waktu: item.waktu,
          trend: calculateMovingAverage(sorted.slice(0, index + 1).map(d => d.responseTime))
        }))
        setTrendData(trend)
      }
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataResponseTime[] = []
      const endpoints = ['/api/users', '/api/metrics', '/api/alerts', '/api/dashboard']
      const now = Date.now()

      for (let i = 99; i >= 0; i--) {
        const timestamp = now - (i * 1000) // 1 detik intervals
        const baseResponse = 50 + Math.random() * 200 // Base 50-250ms
        const spike = Math.random() > 0.95 ? Math.random() * 2000 : 0 // Occasional spikes
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          responseTime: Math.min(maxResponseTime, baseResponse + spike),
          requestCount: Math.floor(Math.random() * 50) + 10,
          errorCount: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0,
          timestamp,
          endpoint
        })
      }

      setData(mockData)

      // Calculate trend
      if (showTrend) {
        const sorted = [...mockData].sort((a, b) => a.timestamp - b.timestamp)
        const trend = sorted.map((item, index) => ({
          waktu: item.waktu,
          trend: calculateMovingAverage(sorted.slice(0, index + 1).map(d => d.responseTime))
        }))
        setTrendData(trend)
      }
    }
  }, [socketData, maxResponseTime, showTrend])

  const calculateMovingAverage = (values: number[], window = 10) => {
    if (values.length < window) return values.reduce((a, b) => a + b, 0) / values.length
    const recent = values.slice(-window)
    return recent.reduce((a, b) => a + b, 0) / window
  }

  const currentData = currentResponse || (data.length > 0 ? data[data.length - 1] : null)
  const currentResponseTime = currentData ? currentData.responseTime : 0

  const isCritical = currentResponseTime >= 3000 // 3 seconds
  const isWarning = currentResponseTime >= 1000 && !isCritical // 1 second
  const isSlow = currentResponseTime >= 500 && !isWarning // 500ms

  const formatResponseTime = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
    return `${value}ms`
  }

  const getResponseTimeColor = (value: number) => {
    if (value >= 3000) return 'var(--status-critical)'
    if (value >= 1000) return 'var(--status-warning)'
    if (value >= 500) return 'var(--accent-secondary)'
    return 'var(--status-online)'
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Response Time</h3>
          <p className="text-body-small text-text-secondary">API response performance</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            isSlow ? 'text-accent-secondary' :
            'text-status-online'
          }`}>
            {formatResponseTime(currentResponseTime)}
          </div>
          <div className="text-body-small text-text-muted">
            Avg Response
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {showScatter ? (
          <ScatterChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--data-grid)"
              opacity={0.3}
            />

            <XAxis
              type="number"
              dataKey="timestamp"
              domain={['dataMin', 'dataMax']}
              stroke="var(--text-secondary)"
              fontSize={11}
              tick={{ fill: 'var(--text-secondary)' }}
              axisLine={{ stroke: 'var(--bg-border)' }}
              tickFormatter={(value) => new Date(value).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            />

            <YAxis
              type="number"
              dataKey="responseTime"
              stroke="var(--text-secondary)"
              fontSize={11}
              tick={{ fill: 'var(--text-secondary)' }}
              axisLine={{ stroke: 'var(--bg-border)' }}
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
              domain={[0, maxResponseTime]}
            />

            <ZAxis
              type="number"
              dataKey="requestCount"
              range={[50, 400]}
            />

            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'responseTime') return [formatResponseTime(value), 'Response Time']
                if (name === 'requestCount') return [value, 'Requests']
                return [value, name]
              }}
              labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString('id-ID')}`}
            />

            {/* Threshold lines */}
            <ReferenceLine
              y={3000}
              stroke="var(--status-critical)"
              strokeDasharray="5 5"
              label={{ value: "Critical", position: "topRight", fill: "var(--status-critical)" }}
            />
            <ReferenceLine
              y={1000}
              stroke="var(--status-warning)"
              strokeDasharray="5 5"
              label={{ value: "Warning", position: "topRight", fill: "var(--status-warning)" }}
            />
            <ReferenceLine
              y={500}
              stroke="var(--accent-secondary)"
              strokeDasharray="5 5"
              label={{ value: "Slow", position: "topRight", fill: "var(--accent-secondary)" }}
            />

            <Scatter
              name="responseTime"
              data={data}
              fill={(entry: any) => getResponseTimeColor(entry.responseTime)}
            />
          </ScatterChart>
        ) : (
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
              stroke="var(--text-secondary)"
              fontSize={11}
              tick={{ fill: 'var(--text-secondary)' }}
              axisLine={{ stroke: 'var(--bg-border)' }}
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
              domain={[0, maxResponseTime]}
            />

            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)'
              }}
              formatter={(value: number, name: string) => {
                return [formatResponseTime(value), name]
              }}
            />

            {/* Threshold lines */}
            <ReferenceLine
              y={3000}
              stroke="var(--status-critical)"
              strokeDasharray="5 5"
              label={{ value: "Critical", position: "topRight", fill: "var(--status-critical)" }}
            />
            <ReferenceLine
              y={1000}
              stroke="var(--status-warning)"
              strokeDasharray="5 5"
              label={{ value: "Warning", position: "topRight", fill: "var(--status-warning)" }}
            />
            <ReferenceLine
              y={500}
              stroke="var(--accent-secondary)"
              strokeDasharray="5 5"
              label={{ value: "Slow", position: "topRight", fill: "var(--accent-secondary)" }}
            />

            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="#00FF88"
              strokeWidth={2}
              name="Response Time"
              dot={false}
              animationDuration={300}
            />

            {/* Trend line */}
            {showTrend && trendData.length > 0 && (
              <Line
                type="monotone"
                data={trendData}
                dataKey="trend"
                stroke="#FF6B00"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Trend"
                dot={false}
                animationDuration={300}
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Response time stats */}
      {currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatResponseTime(currentResponseTime)}
            </div>
            <div className="text-body-small text-text-secondary">Current</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-tertiary">
              {currentData.requestCount}
            </div>
            <div className="text-body-small text-text-secondary">Requests/min</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-status-warning">
              {currentData.errorCount}
            </div>
            <div className="text-body-small text-text-secondary">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-primary">
              {((currentData.requestCount - currentData.errorCount) / currentData.requestCount * 100).toFixed(1)}%
            </div>
            <div className="text-body-small text-text-secondary">Success Rate</div>
          </div>
        </div>
      )}

      {/* Performance indicators */}
      <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-bg-border">
        <div className="text-body-small text-text-secondary mb-2">
          <strong>Response Time Guidelines:</strong>
        </div>
        <div className="grid grid-cols-2 gap-4 text-body-small text-text-muted">
          <div>• &lt; 500ms: Excellent</div>
          <div>• 500-1000ms: Good</div>
          <div>• 1000-3000ms: Slow</div>
          <div>• &gt; 3000ms: Critical</div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Excellent (&lt;500ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">Good (500-1000ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Slow (1000-3000ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&gt;3000ms)</span>
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

export default ChartResponseTime