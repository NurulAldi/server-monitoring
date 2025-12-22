'use client'

import { cn } from '@/utilitas/cn'

interface StatusBadgeProps {
  status: 'online' | 'warning' | 'critical' | 'offline'
  label?: string
  dot?: boolean
  className?: string
}

const statusStyles = {
  online: {
    bg: 'bg-success-green/10',
    text: 'text-success-green',
    border: 'border-success-green/20',
    dot: 'bg-success-green',
  },
  warning: {
    bg: 'bg-warning-amber/10',
    text: 'text-warning-amber',
    border: 'border-warning-amber/20',
    dot: 'bg-warning-amber',
  },
  critical: {
    bg: 'bg-accent-red/10',
    text: 'text-accent-red',
    border: 'border-accent-red/20',
    dot: 'bg-accent-red',
  },
  offline: {
    bg: 'bg-neutral-600/10',
    text: 'text-neutral-500',
    border: 'border-neutral-600/20',
    dot: 'bg-neutral-500',
  },
}

export function StatusBadge({ status, label, dot = false, className }: StatusBadgeProps) {
  const styles = statusStyles[status]

  if (dot) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('w-2 h-2 rounded-full', styles.dot, status === 'online' && 'animate-pulse-subtle')} />
        {label && <span className={cn('text-body-sm font-medium', styles.text)}>{label}</span>}
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-pill text-caption font-semibold uppercase tracking-wider border',
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {label || status}
    </span>
  )
}
