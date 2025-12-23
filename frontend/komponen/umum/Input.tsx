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
          'w-full px-4 py-3 bg-white border rounded-lg text-slate-900 text-body placeholder:text-slate-400 transition-all duration-300 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white focus:border-blue-500 focus:bg-slate-50',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-slate-300',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100',
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