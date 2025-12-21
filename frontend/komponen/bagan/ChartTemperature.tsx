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
import { useTemperatureMetrics } from '../../soket/useMetrics'

interface DataTemperature {
  waktu: string
  cpu: number      // °C
  gpu?: number     // °C (optional)
  motherboard: number // °C
  disk: number     // °C
  ambient: number  // °C
  maxTemp: number  // Maximum safe temperature
  timestamp: number
}

interface PropsChartTemperature {
  serverId?: string
  height?: number
  maxTemp?: number
  showGPU?: boolean
  showAmbient?: boolean
}

export function ChartTemperature({
  serverId,
  height = 300,
  maxTemp = 80,
  showGPU = false,
  showAmbient = true
}: PropsChartTemperature) {
  const { data: socketData, currentTemp, isOnline } = useTemperatureMetrics(serverId)
  const [data, setData] = useState<DataTemperature[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataTemperature[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        cpu: item.cpu || 0,
        gpu: item.gpu,
        motherboard: item.motherboard || 0,
        disk: item.disk || 0,
        ambient: item.ambient || 0,
        maxTemp: item.maxTemp || maxTemp,
        timestamp: item.timestamp
      }))
      setData(transformedData)
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataTemperature[] = []
      const now = Date.now()

      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 10000) // 10 detik intervals (temperature changes slower)
        const baseCpu = 45 + Math.random() * 15 // Base CPU temp 45-60°C
        const baseMb = 35 + Math.random() * 10 // Base MB temp 35-45°C
        const baseDisk = 30 + Math.random() * 8 // Base disk temp 30-38°C
        const baseAmbient = 25 + Math.random() * 5 // Ambient 25-30°C

        const timeOfDay = (timestamp % 86400000) / 3600000 // Hour of day
        const dailyVariation = Math.sin((timeOfDay - 6) * Math.PI / 12) * 5 // Peak at noon

        const loadSpike = Math.random() > 0.9 ? Math.random() * 20 : 0 // Occasional load spikes

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          cpu: Math.round(baseCpu + dailyVariation + loadSpike),
          gpu: showGPU ? Math.round(baseCpu + 5 + Math.random() * 10) : undefined,
          motherboard: Math.round(baseMb + dailyVariation * 0.5),
          disk: Math.round(baseDisk + dailyVariation * 0.3),
          ambient: Math.round(baseAmbient + dailyVariation * 0.2),
          maxTemp,
          timestamp
        })
      }

      setData(mockData)
    }
  }, [socketData, maxTemp, showGPU])

  const currentData = currentTemp || (data.length > 0 ? data[data.length - 1] : null)
  const currentCpuTemp = currentData ? currentData.cpu : 0

  const isCritical = currentCpuTemp >= maxTemp * 0.95
  const isWarning = currentCpuTemp >= maxTemp * 0.85 && !isCritical
  const isHigh = currentCpuTemp >= maxTemp * 0.75 && !isWarning

  const formatTemp = (value: number) => `${value}°C`

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Temperature</h3>
          <p className="text-body-small text-text-secondary">System component temperatures</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            isHigh ? 'text-accent-secondary' :
            'text-status-online'
          }`}>
            {currentCpuTemp}°C
          </div>
          <div className="text-body-small text-text-muted">
            CPU Temp
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
            domain={[20, maxTemp + 10]}
          />

          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)'
            }}
            formatter={(value: number, name: string) => {
              return [formatTemp(value), name]
            }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            y={maxTemp}
            stroke="var(--status-critical)"
            strokeDasharray="5 5"
            label={{ value: "Max Safe", position: "topRight", fill: "var(--status-critical)" }}
          />
          <ReferenceLine
            y={maxTemp * 0.85}
            stroke="var(--status-warning)"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "var(--status-warning)" }}
          />
          <ReferenceLine
            y={maxTemp * 0.75}
            stroke="var(--accent-secondary)"
            strokeDasharray="5 5"
            label={{ value: "High", position: "topRight", fill: "var(--accent-secondary)" }}
          />

          {/* Temperature areas */}
          {showAmbient && (
            <Area
              type="monotone"
              dataKey="ambient"
              stackId="1"
              stroke="#9D4EDD"
              fill="#9D4EDD"
              fillOpacity={0.1}
              name="Ambient"
              animationDuration={300}
            />
          )}

          <Area
            type="monotone"
            dataKey="disk"
            stackId="1"
            stroke="#00D4FF"
            fill="#00D4FF"
            fillOpacity={0.2}
            name="Disk"
            animationDuration={300}
          />

          <Area
            type="monotone"
            dataKey="motherboard"
            stackId="1"
            stroke="#FF6B00"
            fill="#FF6B00"
            fillOpacity={0.3}
            name="Motherboard"
            animationDuration={300}
          />

          {showGPU && currentData?.gpu && (
            <Area
              type="monotone"
              dataKey="gpu"
              stackId="1"
              stroke="#FF0080"
              fill="#FF0080"
              fillOpacity={0.4}
              name="GPU"
              animationDuration={300}
            />
          )}

          <Area
            type="monotone"
            dataKey="cpu"
            stackId="1"
            stroke="#00FF88"
            fill="#00FF88"
            fillOpacity={0.5}
            name="CPU"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Temperature stats */}
      {currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatTemp(currentData.cpu)}
            </div>
            <div className="text-body-small text-text-secondary">CPU</div>
          </div>
          {showGPU && currentData.gpu && (
            <div className="text-center">
              <div className="text-lg font-semibold text-accent-secondary">
                {formatTemp(currentData.gpu)}
              </div>
              <div className="text-body-small text-text-secondary">GPU</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-secondary">
              {formatTemp(currentData.motherboard)}
            </div>
            <div className="text-body-small text-text-secondary">MB</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-tertiary">
              {formatTemp(currentData.disk)}
            </div>
            <div className="text-body-small text-text-secondary">Disk</div>
          </div>
        </div>
      )}

      {/* Temperature gauge visualization */}
      <div className="mt-6 p-4 rounded-lg bg-bg-tertiary border border-bg-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-small text-text-secondary">Temperature Status</span>
          <span className="text-body-small text-text-muted">
            Max: {maxTemp}°C
          </span>
        </div>

        <div className="relative h-4 bg-bg-secondary rounded-full overflow-hidden">
          {/* Temperature zones */}
          <div className="absolute inset-0 flex">
            <div className="bg-status-online flex-1"></div>
            <div className="bg-accent-secondary flex-1"></div>
            <div className="bg-status-warning flex-1"></div>
            <div className="bg-status-critical flex-1"></div>
          </div>

          {/* Current temperature indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-text-primary shadow-lg transition-all duration-300"
            style={{
              left: `${Math.min(100, (currentCpuTemp / maxTemp) * 100)}%`,
              transform: 'translateX(-50%)'
            }}
          ></div>
        </div>

        <div className="flex justify-between mt-1 text-xs text-text-muted">
          <span>Safe</span>
          <span>Warm</span>
          <span>Hot</span>
          <span>Danger</span>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;{Math.round(maxTemp * 0.75)}°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">High ({Math.round(maxTemp * 0.75)}-{Math.round(maxTemp * 0.85)}°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Warning ({Math.round(maxTemp * 0.85)}-{maxTemp}°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-text-secondary">Critical (&gt;{maxTemp}°C)</span>
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

export default ChartTemperature