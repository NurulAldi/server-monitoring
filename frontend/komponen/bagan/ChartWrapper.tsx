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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-md text-high-contrast">{title}</h3>
          {subtitle && (
            <p className="text-body-sm text-neutral-400 mt-1">{subtitle}</p>
          )}
        </div>
        {currentValue !== undefined && (
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ color: statusColor }}>
              {currentValue.toFixed(1)}
              {unit}
            </div>
          </div>
        )}
      </div>

      {children}

      {isLive && (
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-neutral-700">
          <div className="w-2 h-2 rounded-full bg-success-green animate-pulse-subtle"></div>
          <span className="text-body-sm text-neutral-400">Live</span>
        </div>
      )}
    </div>
  )
}

// Common status legend
export function StatusLegend() {
  return (
    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-neutral-700">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-success-green"></div>
        <span className="text-body-sm text-neutral-400">Normal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-warning-amber"></div>
        <span className="text-body-sm text-neutral-400">Warning</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent-red"></div>
        <span className="text-body-sm text-neutral-400">Critical</span>
      </div>
    </div>
  )
}
