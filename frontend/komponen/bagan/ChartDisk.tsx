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
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'
import { useDiskMetrics } from '../../soket/useMetrics'

interface DataDisk {
  waktu: string
  used: number      // GB
  available: number // GB
  total: number     // GB
  usagePercent: number
  readSpeed: number    // MB/s
  writeSpeed: number   // MB/s
  iops: number         // operations per second
  timestamp: number
}

interface PropsChartDisk {
  serverId?: string
  height?: number
  totalDisk?: number // GB
  showIO?: boolean
  showIOPS?: boolean
}

export function ChartDisk({
  serverId,
  height = 300,
  totalDisk = 1000, // 1TB default
  showIO = false,
  showIOPS = false
}: PropsChartDisk) {
  const { data: socketData, currentDisk, isOnline } = useDiskMetrics(serverId)
  const [data, setData] = useState<DataDisk[]>([])

  useEffect(() => {
    if (socketData && socketData.length > 0) {
      // Transform socket data ke format chart
      const transformedData: DataDisk[] = socketData.map(item => ({
        waktu: new Date(item.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        used: item.used || 0,
        available: item.available || 0,
        total: item.total || totalDisk,
        usagePercent: item.usagePercent || 0,
        readSpeed: item.readSpeed || 0,
        writeSpeed: item.writeSpeed || 0,
        iops: item.iops || 0,
        timestamp: item.timestamp
      }))
      setData(transformedData)
    } else {
      // Fallback ke mock data jika socket offline
      const mockData: DataDisk[] = []
      const now = Date.now()

      for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 3000) // 3 detik intervals
        const baseUsage = 200 + Math.random() * 100 // Base usage around 200-300GB
        const growth = (60 - i) * 2 // Gradual increase over time
        const fluctuation = Math.sin(i * 0.1) * 20 // Sine wave fluctuation

        const used = Math.min(totalDisk, baseUsage + growth + fluctuation)
        const usagePercent = (used / totalDisk) * 100

        mockData.push({
          waktu: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          used: Math.round(used),
          available: totalDisk - used,
          total: totalDisk,
          usagePercent: Math.round(usagePercent),
          readSpeed: 50 + Math.random() * 200, // 50-250 MB/s
          writeSpeed: 30 + Math.random() * 150, // 30-180 MB/s
          iops: 1000 + Math.random() * 2000, // 1000-3000 IOPS
          timestamp
        })
      }

      setData(mockData)
    }
  }, [socketData, totalDisk])

  const currentData = currentDisk || (data.length > 0 ? data[data.length - 1] : null)
  const currentUsage = currentData ? currentData.usagePercent : 0

  const isCritical = currentUsage >= 95
  const isWarning = currentUsage >= 85 && !isCritical
  const isHigh = currentUsage >= 75 && !isWarning

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} TB`
    return `${bytes} GB`
  }

  const formatSpeed = (speed: number) => {
    if (speed >= 1000) return `${(speed / 1000).toFixed(2)} GB/s`
    return `${speed.toFixed(0)} MB/s`
  }

  const formatIOPS = (iops: number) => {
    if (iops >= 1000) return `${(iops / 1000).toFixed(1)}K`
    return iops.toString()
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-text-primary">Disk Usage</h3>
          <p className="text-body-small text-text-secondary">Storage utilization & I/O performance</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isCritical ? 'text-status-critical' :
            isWarning ? 'text-status-warning' :
            isHigh ? 'text-accent-secondary' :
            'text-status-online'
          }`}>
            {currentUsage}%
          </div>
          <div className="text-body-small text-text-muted">
            Used
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            yAxisId="usage"
            orientation="left"
            stroke="#8a8d91"
            fontSize={11}
            tick={{ fill: '#8a8d91' }}
            axisLine={{ stroke: '#393c41' }}
            label={{ value: 'GB', angle: -90, position: 'insideLeft' }}
            domain={[0, totalDisk]}
          />

          {showIO && (
            <YAxis
              yAxisId="io"
              orientation="right"
              stroke="#3e6ae1"
              fontSize={11}
              tick={{ fill: '#3e6ae1' }}
              axisLine={{ stroke: '#393c41' }}
              label={{ value: 'MB/s', angle: 90, position: 'insideRight' }}
            />
          )}

          <Tooltip
            contentStyle={{
              background: '#171a20',
              border: '1px solid #393c41',
              borderRadius: '6px',
              color: '#eeeeee'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Used' || name === 'Available') {
                return [formatBytes(value), name]
              }
              if (name === 'Read Speed' || name === 'Write Speed') {
                return [formatSpeed(value), name]
              }
              if (name === 'IOPS') {
                return [formatIOPS(value), name]
              }
              return [value, name]
            }}
          />

          <Legend
            wrapperStyle={{ color: '#8a8d91' }}
          />

          {/* Threshold lines */}
          <ReferenceLine
            yAxisId="usage"
            y={totalDisk * 0.95}
            stroke="#e31937"
            strokeDasharray="5 5"
            label={{ value: "Critical", position: "topRight", fill: "#e31937" }}
          />
          <ReferenceLine
            yAxisId="usage"
            y={totalDisk * 0.85}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "Warning", position: "topRight", fill: "#f7c948" }}
          />
          <ReferenceLine
            yAxisId="usage"
            y={totalDisk * 0.75}
            stroke="#f7c948"
            strokeDasharray="5 5"
            label={{ value: "High", position: "topRight", fill: "#f7c948" }}
          />

          {/* Area for available space */}
          <Area
            yAxisId="usage"
            type="monotone"
            dataKey="available"
            stackId="1"
            stroke="transparent"
            fill="#00d448"
            fillOpacity={0.1}
            name="Available"
          />

          {/* Area for used space */}
          <Area
            yAxisId="usage"
            type="monotone"
            dataKey="used"
            stackId="1"
            stroke="#3e6ae1"
            fill="#3e6ae1"
            fillOpacity={0.6}
            name="Used"
          />

          {/* I/O lines (optional) */}
          {showIO && (
            <>
              <Line
                yAxisId="io"
                type="monotone"
                dataKey="readSpeed"
                stroke="#00d448"
                strokeWidth={2}
                name="Read Speed"
                dot={false}
                animationDuration={300}
              />
              <Line
                yAxisId="io"
                type="monotone"
                dataKey="writeSpeed"
                stroke="#f7c948"
                strokeWidth={2}
                name="Write Speed"
                dot={false}
                animationDuration={300}
              />
            </>
          )}

          {/* IOPS line (optional) */}
          {showIOPS && (
            <Line
              yAxisId="io"
              type="monotone"
              dataKey="iops"
              stroke="#9D4EDD"
              strokeWidth={1}
              strokeDasharray="5 5"
              name="IOPS"
              dot={false}
              animationDuration={300}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Disk stats */}
      {currentData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-accent-primary">
              {formatBytes(currentData.used)}
            </div>
            <div className="text-body-small text-text-secondary">Used</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-status-online">
              {formatBytes(currentData.available)}
            </div>
            <div className="text-body-small text-text-secondary">Available</div>
          </div>
          {showIO && (
            <>
              <div className="text-center">
                <div className="text-lg font-semibold text-status-online">
                  {formatSpeed(currentData.readSpeed)}
                </div>
                <div className="text-body-small text-text-secondary">Read</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-accent-secondary">
                  {formatSpeed(currentData.writeSpeed)}
                </div>
                <div className="text-body-small text-text-secondary">Write</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-4 text-body-small">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-online"></div>
            <span className="text-text-secondary">Normal (&lt;75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-secondary"></div>
            <span className="text-text-secondary">High (75-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-text-secondary">Warning (85-95%)</span>
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

export default ChartDisk