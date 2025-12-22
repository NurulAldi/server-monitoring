import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utilitas/cn'

const varianTombol = cva(
  'inline-flex items-center justify-center font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-pure-black disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-high-contrast text-pure-black hover:bg-soft-white active:scale-[0.98]',
        secondary: 'bg-deep-grey text-high-contrast border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 active:scale-[0.98]',
        ghost: 'bg-transparent text-high-contrast hover:bg-neutral-800 active:scale-[0.98]',
        danger: 'bg-accent-red text-high-contrast hover:bg-opacity-90 active:scale-[0.98]',
        outline: 'bg-transparent border border-neutral-600 text-high-contrast hover:border-high-contrast hover:bg-neutral-800 active:scale-[0.98]',
        glass: 'glass text-high-contrast hover:bg-opacity-90 active:scale-[0.98]',
      },
      size: {
        sm: 'text-body-sm px-4 py-2 rounded-pill',
        default: 'text-body px-6 py-3 rounded-pill',
        lg: 'text-body-lg px-8 py-4 rounded-pill',
        icon: 'p-3 rounded-full',
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

// Backwards-compatible alias: some components import { Button } instead of { Tombol }
export { Tombol as Button, Tombol, varianTombol }