import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utilitas/cn'

const varianTombol = cva(
  'btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
        outline: 'border border-bg-border hover:border-accent-primary hover:bg-bg-tertiary',
      },
      size: {
        sm: 'text-xs px-3 py-1.5',
        default: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
        icon: 'p-2 w-10 h-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface PropsTombol
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof varianTombol> {}

const Tombol = forwardRef<HTMLButtonElement, PropsTombol>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(varianTombol({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Tombol.displayName = 'Tombol'

export { Tombol, varianTombol }