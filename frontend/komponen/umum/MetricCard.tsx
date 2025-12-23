import { ReactNode } from 'react'
import { cn } from '@/utilitas/cn'

interface PropsMetricCard {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className
}: PropsMetricCard) {
  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-xl shadow-sm p-6 transition-all duration-300',
      'hover:shadow-md hover:border-slate-300',
      className
    )}>
      {/* Header: Label + Icon */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        {icon && (
          <div className="text-slate-400">{icon}</div>
        )}
      </div>

      {/* Metric Value - Large and Bold */}
      <div className="text-3xl font-bold text-slate-900 mb-2">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-sm text-slate-600 mb-2">{subtitle}</div>
      )}

      {/* Trend Indicator */}
      {trend && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium mt-4 pt-4 border-t border-slate-100',
          trend.isPositive ? 'text-emerald-600' : 'text-red-600'
        )}>
          <span className="text-base">
            {trend.isPositive ? '↑' : '↓'}
          </span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-xs text-slate-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  )
}

export default MetricCard