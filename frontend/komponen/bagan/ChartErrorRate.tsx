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
  Legend,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts'
import { useErrorRateMetrics } from '../../soket/useAppMetrics'

interface DataErrorRate {
  waktu: string
  totalRequests: number
  successfulRequests: number
  error4xx: number  // Client errors
  error5xx: number  // Server errors
  timeoutErrors: number
  networkErrors: number
  errorRate: number // percentage
  timestamp: number
}

interface PropsChartErrorRate {
  height?: number
  maxErrorRate?: number
  showStacked?: boolean
  showBar?: boolean
}

export function ChartErrorRate({
  height = 300,
  maxErrorRate = 10, // 10%
  showStacked = true,
  showBar = false
}: PropsChartErrorRate) {
  const { data: socketData, currentErrors, isOnline } = useErrorRateMetrics()
  const [data, setData] = useState<DataErrorRate[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataErrorRate[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        totalRequests: item.totalRequests || 0,
        successfulRequests: item.successfulRequests || 0,
        error4xx: item.error4xx || 0,
        error5xx: item.error5xx || 0,
        timeoutErrors: item.timeoutErrors || 0,
        networkErrors: item.networkErrors || 0,
        errorRate: item.errorRate || 0,
        timestamp: item.timestamp
      }))
      setData(transformedData)
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataErrorRate[] = []
      const now = Date.now()

      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 2000) // 2 detik intervals
        const baseRequests = 100 + Math.random() * 200 // 100-300 requests per interval

        // Normal operation with occasional error spikes
        const normalErrorRate = Math.random() * 2 // 0-2% normal
        const spike = Math.random() > 0.92 ? Math.random() * 15 : 0 // Occasional spikes up to 15%
        const totalErrorRate = Math.min(maxErrorRate, normalErrorRate + spike)

        const totalRequests = Math.round(baseRequests)
        const errorCount = Math.round((totalErrorRate / 100) * totalRequests)
        const successfulRequests = totalRequests - errorCount

        // Distribute errors by type
        const error4xx = Math.round(errorCount * (0.6 + Math.random() * 0.3)) // 60-90% client errors
        const error5xx = Math.round(errorCount * (0.1 + Math.random() * 0.2)) // 10-30% server errors
        const timeoutErrors = Math.round(errorCount * (0.05 + Math.random() * 0.1)) // 5-15% timeouts
        const networkErrors = errorCount - error4xx - error5xx - timeoutErrors

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          totalRequests,
          successfulRequests,
          error4xx,
          error5xx,
          timeoutErrors,
          networkErrors,
          errorRate: totalErrorRate,
          timestamp
        })
      }

      setData(mockData)
    }
  }, [socketData, maxErrorRate])

  const currentData = currentErrors || (data.length > 0 ? data[data.length - 1] : null)
  const currentErrorRate = currentData ? currentData.errorRate : 0

  const isCritical = currentErrorRate >= 5 // 5%
  const isWarning = currentErrorRate >= 2 && !isCritical // 2%
  const isElevated = currentErrorRate >= 1 && !isWarning // 1%

  const formatErrorRate = (value: number) => `${value.toFixed(2)}%`
  const formatCount = (value: number) => value.toLocaleString()

  const ChartComponent = showBar ? BarChart : AreaChart

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Error Rate</h3>
          <p className="text-body-small text-text-secondary">Request failure analysis</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            isElevated ? 'text-accent-secondary' :
            'text-status-online'
          }`}>
            {formatErrorRate(currentErrorRate)}
          </div>
          <div className="text-body-small text-text-muted">
            Error Rate
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            label={{ value: showBar ? 'Error Count' : 'Error Rate (%)', angle: -90, position: 'insideLeft' }}
            domain={showBar ? [0, 'dataMax + 10'] : [0, maxErrorRate]}
          />

          <Tooltip
            contentStyle={{
              background: '#171a20',
              border: '1px solid #393c41',
              borderRadius: '6px',
              color: '#eeeeee'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'errorRate') return [formatErrorRate(value), 'Error Rate']
              return [formatCount(value), name]
            }}
          />

          <Legend
            wrapperStyle={{ color: '#8a8d91' }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            y={showBar ? undefined : 5}
            stroke="#e31937"
            strokeDasharray="5 5"
            label={showBar ? undefined : { value: "Critical", position: "topRight", fill: "#e31937" }}
          />
          <ReferenceLine
            y={showBar ? undefined : 2}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={showBar ? undefined : { value: "Warning", position: "topRight", fill: "#f7c948" }}
          />
          <ReferenceLine
            y={showBar ? undefined : 1}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={showBar ? undefined : { value: "Elevated", position: "topRight", fill: "#f7c948" }}
          />

          {showBar ? (
            // Bar chart for error counts
            <>
              <Bar dataKey="error4xx" stackId="errors" fill="#f7c948" name="4xx Errors" />
              <Bar dataKey="error5xx" stackId="errors" fill="#e31937" name="5xx Errors" />
              <Bar dataKey="timeoutErrors" stackId="errors" fill="#8a8d91" name="Timeouts" />
              <Bar dataKey="networkErrors" stackId="errors" fill="#3e6ae1" name="Network" />
            </>
          ) : showStacked ? (
            // Stacked area chart for error rates
            <>
              <Area
                type="monotone"
                dataKey="errorRate"
                stackId="1"
                stroke="#e31937"
                fill="#e31937"
                fillOpacity={0.8}
                name="Total Error Rate"
                animationDuration={300}
              />
            </>
          ) : (
            // Line chart for error rate trend
            <Area
              type="monotone"
              dataKey="errorRate"
              stroke="#FF0080"
              fill="#FF0080"
              fillOpacity={0.3}
              name="Error Rate"
              animationDuration={300}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Error stats */}
      {currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-status-critical">
              {formatErrorRate(currentErrorRate)}
            </div>
            <div className="text-body-small text-text-secondary">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-secondary">
              {formatCount(currentData.error4xx)}
            </div>
            <div className="text-body-small text-text-secondary">4xx Errors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-secondary">
              {formatCount(currentData.error5xx)}
            </div>
            <div className="text-body-small text-text-secondary">5xx Errors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatCount(currentData.successfulRequests)}
            </div>
            <div className="text-body-small text-text-secondary">Successful</div>
          </div>
        </div>
      )}

      {/* Error breakdown */}
      {currentData && (
        <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-bg-border">
          <div className="text-body-small text-text-secondary mb-2">
            <strong>Error Distribution:</strong>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-body-small">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
              <span>4xx: {((currentData.error4xx / (currentData.totalRequests || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
              <span>5xx: {((currentData.error5xx / (currentData.totalRequests || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-primary"></div>
              <span>Timeout: {((currentData.timeoutErrors / (currentData.totalRequests || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-tertiary"></div>
              <span>Network: {((currentData.networkErrors / (currentData.totalRequests || 1)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;1%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">Elevated (1-2%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Warning (2-5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&gt;5%)</span>
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

export default ChartErrorRate