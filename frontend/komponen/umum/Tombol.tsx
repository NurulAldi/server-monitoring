import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utilitas/cn'

const varianTombol = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm',
        secondary: 'bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 hover:border-slate-400 active:scale-[0.98]',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 active:scale-[0.98]',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-sm',
        outline: 'bg-transparent border-2 border-slate-300 text-slate-900 hover:border-slate-900 hover:bg-slate-50 active:scale-[0.98]',
        glass: 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 active:scale-[0.98] shadow-sm',
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