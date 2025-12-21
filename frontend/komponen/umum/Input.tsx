import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utilitas/cn'

export interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, PropsInput>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn('input', className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }