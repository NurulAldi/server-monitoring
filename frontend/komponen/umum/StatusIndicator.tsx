import { cn } from '@/utilitas/cn'

interface PropsStatusIndicator {
  status: 'online' | 'warning' | 'critical' | 'offline'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  online: {
    label: 'Online',
    className: 'server-status-indicator online',
    badgeClass: 'badge-online',
  },
  warning: {
    label: 'Warning',
    className: 'server-status-indicator warning',
    badgeClass: 'badge-warning',
  },
  critical: {
    label: 'Critical',
    className: 'server-status-indicator critical',
    badgeClass: 'badge-critical',
  },
  offline: {
    label: 'Offline',
    className: 'server-status-indicator offline',
    badgeClass: 'badge-offline',
  },
}

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  className
}: PropsStatusIndicator) {
  const config = statusConfig[status]

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  if (showLabel) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(config.className, sizeClasses[size])} />
        <span className={cn('badge', config.badgeClass)}>
          {config.label}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(config.className, sizeClasses[size], className)}
      title={config.label}
    />
  )
}

export default StatusIndicator