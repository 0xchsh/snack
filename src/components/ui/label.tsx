import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const labelVariants = cva('text-sm font-medium text-foreground', {
  variants: {
    size: {
      default: '',
      sm: 'text-xs',
      lg: 'text-base',
    },
    muted: {
      true: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, muted, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ size, muted }), className)}
        {...props}
      />
    )
  }
)

Label.displayName = 'Label'

export { Label, labelVariants }
