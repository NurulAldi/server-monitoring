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
    <div className={cn('metric-card', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-data-label">{title}</span>
        {icon && <div className="text-text-secondary">{icon}</div>}
      </div>

      <div className="metric-value">{value}</div>

      {subtitle && (
        <div className="metric-label">{subtitle}</div>
      )}

      {trend && (
        <div className={cn(
          'flex items-center mt-2 text-xs',
          trend.isPositive ? 'text-status-online' : 'text-status-critical'
        )}>
          <span className={cn(
            'mr-1',
            trend.isPositive ? '↑' : '↓'
          )}>
            {trend.isPositive ? '↑' : '↓'}
          </span>
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  )
}

export default MetricCard