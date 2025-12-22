import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utilitas/cn'

export interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, PropsInput>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full px-4 py-3 bg-deep-grey border rounded-lg text-high-contrast text-body placeholder:text-neutral-500 transition-smooth',
          'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-pure-black focus:border-accent-blue focus:bg-neutral-800',
          error
            ? 'border-accent-red focus:ring-accent-red'
            : 'border-neutral-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }