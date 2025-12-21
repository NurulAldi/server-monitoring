import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utilitas/cn'

export interface PropsLabel extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, PropsLabel>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-body font-medium text-text-primary leading-none', className)}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }