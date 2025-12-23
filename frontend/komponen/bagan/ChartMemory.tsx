'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMemoryMetrics } from '@/soket/useMetrics'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

interface DataMemory {
  waktu: string
  used: number
  free: number
  cached: number
  buffers: number
  total: number
  timestamp: number
}

interface PropsChartMemory {
  serverId?: string
  mode?: 'donut' | 'area' | 'both'
  showBreakdown?: boolean
  showRealtime?: boolean
}

const MEMORY_COLORS = {
  used: '#3e6ae1',      // Accent Blue
  cached: '#8a8d91',    // Neutral 500
  buffers: '#5c5e62',   // Neutral 600
  free: '#00d448'       // Success Green
}

export function ChartMemory({
  serverId,
  mode = 'both',
  showBreakdown = true,
  showRealtime = true
}: PropsChartMemory) {
  const { data: socketData, currentMemory, isOnline } = useMemoryMetrics(serverId)
  const [data, setData] = useState<DataMemory[]>([])
  const [currentData, setCurrentData] = useState<DataMemory | null>(null)

  useEffect(() => {
    if (socketData && socketData.length > 0 && showRealtime) {
      // Use real-time data from socket
      setData(prevData => {
        const newPoint = socketData[0]
        const last = prevData[prevData.length - 1]
        // Only add if timestamp is different
        if (!last || last.timestamp !== newPoint.timestamp) {
          const transformedPoint = {
            waktu: newPoint.waktu,
            used: newPoint.used,
            free: newPoint.available,
            cached: Math.round(newPoint.used * 0.2),
            buffers: Math.round(newPoint.used * 0.05),
            total: newPoint.total,
            timestamp: newPoint.timestamp
          }
          const updated = [...prevData, transformedPoint].slice(-30)
          // Deep equality check
          if (JSON.stringify(prevData) !== JSON.stringify(updated)) {
            return updated
          }
        }
        return prevData
      })
      if (socketData.length > 0) {
        const lastItem = socketData[socketData.length - 1]
        setCurrentData({
          waktu: lastItem.waktu,
          used: lastItem.used,
          free: lastItem.available,
          cached: Math.round(lastItem.used * 0.2),
          buffers: Math.round(lastItem.used * 0.05),
          total: lastItem.total,
          timestamp: lastItem.timestamp
        })
      }
    } else if (!showRealtime) {
      // Mock data untuk demo when realtime is disabled
      const mockData: DataMemory[] = []
      const now = Date.now()
      const totalMemory = 8192 // 8GB

      for (let i = 29; i >= 0; i--) {
        const timestamp = now - (i * 20000) // 20 detik intervals
        const usedBase = 3000 + Math.random() * 2000
        const cached = 800 + Math.random() * 400
        const buffers = 200 + Math.random() * 100
        const used = Math.min(totalMemory, usedBase)
        const free = totalMemory - used - cached - buffers

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          used: Math.max(0, used),
          cached,
          buffers,
          free: Math.max(0, free),
          total: totalMemory,
          timestamp
        })
      }
      setData(mockData)
      setCurrentData(mockData[mockData.length - 1])
    }
  }, [socketData, showRealtime])

  const getMemoryUsagePercent = () => {
    if (!currentData) return 0
    return ((currentData.used + currentData.cached + currentData.buffers) / currentData.total * 100)
  }

  const getDonutData = () => {
    if (!currentData) return []

    return [
      {
        name: 'Used',
        value: currentData.used,
        color: MEMORY_COLORS.used,
        percentage: (currentData.used / currentData.total * 100).toFixed(1)
      },
      {
        name: 'Cached',
        value: currentData.cached,
        color: MEMORY_COLORS.cached,
        percentage: (currentData.cached / currentData.total * 100).toFixed(1)
      },
      {
        name: 'Buffers',
        value: currentData.buffers,
        color: MEMORY_COLORS.buffers,
        percentage: (currentData.buffers / currentData.total * 100).toFixed(1)
      },
      {
        name: 'Free',
        value: currentData.free,
        color: MEMORY_COLORS.free,
        percentage: (currentData.free / currentData.total * 100).toFixed(1)
      }
    ]
  }

  const usagePercent = getMemoryUsagePercent()
  const isCritical = usagePercent >= 95
  const isWarning = usagePercent >= 85 && !isCritical

  const renderDonutChart = () => (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={getDonutData()}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
          >
            {getDonutData().map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#171a20',
              border: '1px solid #393c41',
              borderRadius: '6px',
              color: '#eeeeee'
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(0)} MB (${getDonutData().find(d => d.name === name)?.percentage}%)`,
              name
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-center mt-4">
        <div className={`text-3xl font-bold ${
          isCritical ? 'text-status-critical' :
          isWarning ? 'text-status-warning' :
          'text-status-online'
        }`}>
          {usagePercent.toFixed(1)}%
        </div>
        <div className="text-body-small text-text-secondary">Memory Used</div>
        <div className="text-body-small text-text-muted">
          {currentData ? `${(currentData.used + currentData.cached + currentData.buffers).toFixed(0)} / ${currentData.total} MB` : ''}
        </div>
      </div>
    </div>
  )

  const renderAreaChart = useCallback(() => (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} isAnimationActive={false}>
        <defs>
          <linearGradient id="usedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={MEMORY_COLORS.used} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={MEMORY_COLORS.used} stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="cachedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={MEMORY_COLORS.cached} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={MEMORY_COLORS.cached} stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="buffersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={MEMORY_COLORS.buffers} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={MEMORY_COLORS.buffers} stopOpacity={0.1}/>
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#393c41" opacity={0.3} />
        <XAxis
          dataKey="waktu"
          stroke="#8a8d91"
          fontSize={11}
          tick={{ fill: '#8a8d91' }}
        />
        <YAxis
          stroke="#8a8d91"
          fontSize={11}
          tick={{ fill: '#8a8d91' }}
          label={{ value: 'MB', angle: -90, position: 'insideLeft' }}
        />

        <Tooltip
          contentStyle={{
            background: '#171a20',
            border: '1px solid #393c41',
            borderRadius: '6px',
            color: '#eeeeee'
          }}
          formatter={(value: number, name: string) => [`${value.toFixed(0)} MB`, name]}
        />

        <Area
          type="monotone"
          dataKey="used"
          stackId="1"
          stroke={MEMORY_COLORS.used}
          fill="url(#usedGradient)"
          name="Used"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="cached"
          stackId="1"
          stroke={MEMORY_COLORS.cached}
          fill="url(#cachedGradient)"
          name="Cached"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="buffers"
          stackId="1"
          stroke={MEMORY_COLORS.buffers}
          fill="url(#buffersGradient)"
          name="Buffers"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  ), [data])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Memory Usage</h3>
          <p className="text-body-small text-text-secondary">RAM utilization breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-status-online animate-pulse"></div>
          <span className="text-body-small text-text-secondary">Live</span>
        </div>
      </div>

      {mode === 'donut' && renderDonutChart()}

      {mode === 'area' && renderAreaChart()}

      {mode === 'both' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex justify-center">
            {renderDonutChart()}
          </div>
          <div>
            {renderAreaChart()}
          </div>
        </div>
      )}

      {showBreakdown && currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {getDonutData().map((item) => (
            <div key={item.name} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-body-small text-text-secondary">{item.name}</span>
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {item.percentage}%
              </div>
              <div className="text-body-small text-text-muted">
                {item.value.toFixed(0)} MB
              </div>
            </div>
          ))}
        </div>
      )}

      {showRealtime && (
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-status-online animate-pulse' : 'bg-status-critical'}`}></div>
            <span className="text-body-small text-text-secondary">
              {isOnline ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChartMemory