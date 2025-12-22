'use client'

import { ReactNode } from 'react'
import { cn } from '@/utilitas/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
}

export function Card({ children, className, hover = true, glass = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-8 transition-smooth',
        glass ? 'glass' : 'bg-deep-grey border border-neutral-700',
        hover && 'hover:-translate-y-1 hover:border-neutral-600',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('pb-6 border-b border-neutral-700', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-heading-md font-semibold text-high-contrast', className)}>
      {children}
    </h3>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('pt-6', className)}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('pt-6 mt-6 border-t border-neutral-700', className)}>
      {children}
    </div>
  )
}
