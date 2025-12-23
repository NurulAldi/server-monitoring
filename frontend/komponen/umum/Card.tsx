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
        'rounded-xl p-8 transition-all duration-300 ease-in-out',
        glass ? 'glass shadow-sm' : 'bg-white border border-slate-200 shadow-sm',
        hover && 'hover:-translate-y-1 hover:shadow-md hover:border-slate-300',
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
    <div className={cn('pb-6 border-b border-slate-200', className)}>
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
    <h3 className={cn('text-heading-md font-semibold text-slate-900', className)}>
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
    <div className={cn('pt-6 mt-6 border-t border-slate-200', className)}>
      {children}
    </div>
  )
}
