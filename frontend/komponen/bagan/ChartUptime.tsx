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
import { useUptimeMetrics } from '../../soket/useAppMetrics'

interface DataUptime {
  waktu: string
  uptime: number        // percentage (0-100)
  downtime: number      // minutes
  totalTime: number     // total minutes in period
  incidents: number     // number of incidents
  mttr: number         // mean time to recovery in minutes
  timestamp: number
}

interface PropsChartUptime {
  height?: number
  targetUptime?: number // target uptime percentage
  showArea?: boolean
}

export function ChartUptime({
  height = 300,
  targetUptime = 99.9, // 99.9% SLA
  showArea = true
}: PropsChartUptime) {
  const { data: socketData, currentUptime: socketUptime, isOnline } = useUptimeMetrics()
  const [data, setData] = useState<DataUptime[]>([])
  const [currentUptime, setCurrentUptime] = useState(0)

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataUptime[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        uptime: item.uptime || 0,
        downtime: item.downtime || 0,
        totalTime: item.totalTime || 60,
        incidents: item.incidents || 0,
        mttr: item.mttr || 0,
        timestamp: item.timestamp
      }))
      setData(transformedData)
      setCurrentUptime(socketUptime?.uptime || transformedData[transformedData.length - 1]?.uptime || 0)
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataUptime[] = []
      const now = Date.now()

      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 60000) // 1 minute intervals (showing last hour)
        const baseUptime = 99.5 + Math.random() * 0.4 // Base 99.5-99.9%

        // Occasional downtime events
        const incident = Math.random() > 0.95 // 5% chance of incident
        const downtimeMinutes = incident ? Math.random() * 5 : 0 // Up to 5 minutes downtime
        const actualUptime = incident ? Math.max(95, baseUptime - (downtimeMinutes / 60 * 100)) : baseUptime

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          uptime: Math.round(actualUptime * 100) / 100,
          downtime: Math.round(downtimeMinutes * 100) / 100,
          totalTime: 60, // 60 minutes per interval
          incidents: incident ? 1 : 0,
          mttr: incident ? Math.round((Math.random() * 15 + 5) * 100) / 100 : 0, // 5-20 minutes MTTR
          timestamp
        })
      }

      setData(mockData)
      setCurrentUptime(mockData[mockData.length - 1].uptime)
    }
  }, [socketData, socketUptime])

  const isBelowSLA = currentUptime < targetUptime
  const isAtRisk = currentUptime < 99.5 && !isBelowSLA
  const isExcellent = currentUptime >= 99.95

  const formatUptime = (value: number) => `${value.toFixed(2)}%`
  const formatTime = (value: number) => `${value.toFixed(1)}m`

  // Calculate uptime statistics
  const totalIncidents = data.reduce((sum, item) => sum + item.incidents, 0)
  const totalDowntime = data.reduce((sum, item) => sum + item.downtime, 0)
  const avgUptime = data.length > 0 ? data.reduce((sum, item) => sum + item.uptime, 0) / data.length : 0
  const avgMttr = data.length > 0 ? data.filter(item => item.mttr > 0).reduce((sum, item) => sum + item.mttr, 0) / Math.max(1, data.filter(item => item.mttr > 0).length) : 0

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Uptime</h3>
          <p className="text-body-small text-text-secondary">Service availability monitoring</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isExcellent ? 'text-status-online' :
            isAtRisk ? 'text-accent-secondary' :
            isBelowSLA ? 'text-status-warning' :
            'text-status-critical'
          }`}>
            {formatUptime(currentUptime)}
          </div>
          <div className="text-body-small text-text-muted">
            Current Uptime
          </div>
        </div>
      </div>

      {/* Circular progress indicator */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#393c41"
              strokeWidth="8"
              fill="none"
            />

            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke={
                isExcellent ? '#00d448' :
                isAtRisk ? '#f7c948' :
                isBelowSLA ? '#f7c948' :
                '#e31937'
              }
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(currentUptime / 100) * 314} 314`}
              className="transition-all duration-1000 ease-out"
            />

            {/* Target line */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#3e6ae1"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${(targetUptime / 100) * 314} 314`}
              opacity="0.5"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-xl font-bold ${
              isExcellent ? 'text-status-online' :
              isAtRisk ? 'text-accent-secondary' :
              isBelowSLA ? 'text-status-warning' :
              'text-status-critical'
            }`}>
              {formatUptime(currentUptime)}
            </div>
            <div className="text-xs text-text-muted">Uptime</div>
          </div>
        </div>
      </div>

      {/* Uptime chart */}
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              label={{ value: 'Uptime %', angle: -90, position: 'insideLeft' }}
              domain={[95, 100]}
            />

            <Tooltip
              contentStyle={{
                background: '#171a20',
                border: '1px solid #393c41',
                borderRadius: '6px',
                color: '#eeeeee'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'uptime') return [formatUptime(value), 'Uptime']
                if (name === 'downtime') return [formatTime(value), 'Downtime']
                return [value, name]
              }}
            />

            {/* Target line */}
            <ReferenceLine
              y={targetUptime}
              stroke="#3e6ae1"
              strokeDasharray="5 5"
              label={{ value: `Target ${formatUptime(targetUptime)}`, position: "topRight", fill: "#3e6ae1" }}
            />

            <Area
              type="monotone"
              dataKey="uptime"
              stroke="#00d448"
              fill="#00d448"
              fillOpacity={0.3}
              name="uptime"
              animationDuration={300}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              label={{ value: 'Uptime %', angle: -90, position: 'insideLeft' }}
              domain={[95, 100]}
            />

            <Tooltip
              contentStyle={{
                background: '#171a20',
                border: '1px solid #393c41',
                borderRadius: '6px',
                color: '#eeeeee'
              }}
              formatter={(value: number, name: string) => {
                return [formatUptime(value), name]
              }}
            />

            {/* Target line */}
            <ReferenceLine
              y={targetUptime}
              stroke="#3e6ae1"
              strokeDasharray="5 5"
              label={{ value: `Target ${formatUptime(targetUptime)}`, position: "topRight", fill: "#3e6ae1" }}
            />

            <Line
              type="monotone"
              dataKey="uptime"
              stroke="#00FF88"
              strokeWidth={2}
              name="Uptime"
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Uptime stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-status-online">
            {formatUptime(avgUptime)}
          </div>
          <div className="text-body-small text-text-secondary">Avg Uptime</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-status-critical">
            {totalIncidents}
          </div>
          <div className="text-body-small text-text-secondary">Incidents</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-accent-secondary">
            {formatTime(totalDowntime)}
          </div>
          <div className="text-body-small text-text-secondary">Total Downtime</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-accent-tertiary">
            {avgMttr > 0 ? formatTime(avgMttr) : 'N/A'}
          </div>
          <div className="text-body-small text-text-secondary">Avg MTTR</div>
        </div>
      </div>

      {/* SLA status */}
      <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-bg-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-small text-text-secondary">
            <strong>SLA Status:</strong>
          </span>
          <span className={`text-body-small font-semibold ${
            isExcellent ? 'text-status-online' :
            isAtRisk ? 'text-accent-secondary' :
            isBelowSLA ? 'text-status-warning' :
            'text-status-critical'
          }`}>
            {isExcellent ? 'Excellent' : isAtRisk ? 'At Risk' : isBelowSLA ? 'Below SLA' : 'Critical'}
          </span>
        </div>
        <div className="text-body-small text-text-muted">
          Target: {formatUptime(targetUptime)} | Current: {formatUptime(currentUptime)}
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Excellent (≥99.95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">Good (99.5-99.95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">At Risk (99.0-99.5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&lt;99.0%)</span>
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

export default ChartUptime