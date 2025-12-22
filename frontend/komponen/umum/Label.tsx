import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utilitas/cn'

export interface PropsLabel extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = forwardRef<HTMLLabelElement, PropsLabel>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-body-sm font-medium text-high-contrast mb-2 leading-none', className)}
      {...props}
    >
      {children}
      {required && <span className="text-accent-red ml-1">*</span>}
    </label>
  )
)
Label.displayName = 'Label'

export { Label }