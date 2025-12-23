// HOC to apply Tesla chart theme to all Recharts components
import { ReactNode } from 'react'

interface ChartWrapperProps {
  title: string
  currentValue?: number
  unit?: string
  subtitle?: string
  children: ReactNode
  statusColor?: string
  isLive?: boolean
}

export function ChartWrapper({
  title,
  currentValue,
  unit = '%',
  subtitle,
  children,
  statusColor = '#eeeeee',
  isLive = false,
}: ChartWrapperProps) {
  return (
    <div className="w-full">
      {/* Chart Header - Strict 8px Grid */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {currentValue !== undefined && (
          <div className="text-right">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
              Current
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {currentValue.toFixed(1)}
              <span className="text-xl text-slate-600 ml-1">{unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Content */}
      {children}

      {/* Live Indicator */}
      {isLive && (
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle"></div>
          <span className="text-sm text-slate-600">Live Data</span>
        </div>
      )}
    </div>
  )
}

// Common status legend
export function StatusLegend() {
  return (
    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-200">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        <span className="text-body-sm text-slate-600">Normal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        <span className="text-body-sm text-slate-600">Warning</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <span className="text-body-sm text-slate-600">Critical</span>
      </div>
    </div>
  )
}
