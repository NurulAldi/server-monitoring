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
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  offline: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
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
