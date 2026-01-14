import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_*]:text-inherit',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active active:scale-[0.98]',
        muted:
          'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted-hover active:bg-muted-active active:scale-[0.98]',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-secondary-hover active:bg-secondary-active active:scale-[0.98]',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary-hover active:bg-secondary-active active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active active:scale-[0.98]',
      },
      size: {
        default: 'h-icon-button px-4 rounded-lg text-sm',
        sm: 'px-3 py-2 rounded-md text-sm',
        lg: 'px-6 py-3 rounded-lg text-base',
        icon: 'h-icon-button w-icon-button rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
