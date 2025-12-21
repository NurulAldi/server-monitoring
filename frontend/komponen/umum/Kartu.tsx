import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utilitas/cn'

const Kartu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card', className)}
      {...props}
    />
  )
)
Kartu.displayName = 'Kartu'

const HeaderKartu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card-header', className)}
      {...props}
    />
  )
)
HeaderKartu.displayName = 'HeaderKartu'

const JudulKartu = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-heading text-text-primary', className)}
      {...props}
    />
  )
)
JudulKartu.displayName = 'JudulKartu'

const DeskripsiKartu = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body text-text-secondary', className)}
      {...props}
    />
  )
)
DeskripsiKartu.displayName = 'DeskripsiKartu'

const KontenKartu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-body', className)} {...props} />
  )
)
KontenKartu.displayName = 'KontenKartu'

const FooterKartu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card-footer', className)}
      {...props}
    />
  )
)
FooterKartu.displayName = 'FooterKartu'

export { Kartu, HeaderKartu, JudulKartu, DeskripsiKartu, KontenKartu, FooterKartu }