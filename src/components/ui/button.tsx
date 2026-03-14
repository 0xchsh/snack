'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        primary:
          'btn-classic btn-classic-primary bg-primary text-primary-foreground',
        secondary:
          'btn-classic btn-classic-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80',
        muted:
          'hover:bg-muted hover:text-foreground text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground',
        outline:
          'btn-classic btn-classic-outline bg-background hover:bg-muted hover:text-foreground',
        destructive:
          'btn-classic btn-classic-destructive bg-destructive text-white focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
        link: 'text-primary underline-offset-4 hover:underline hover:decoration-dotted hover:decoration-muted-foreground/50',
      },
      size: {
        default: 'h-8 gap-1.5 px-2.5',
        xs: 'h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-7 gap-1 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*="size-"])]:size-3.5',
        lg: 'h-9 gap-1.5 px-2.5',
        icon: 'size-8',
        'icon-xs': 'size-6 rounded-md [&_svg:not([class*="size-"])]:size-3',
        'icon-sm': 'size-7 rounded-md',
        'icon-lg': 'size-9',
        'icon-mobile': 'min-h-[2.75rem] min-w-[2.75rem] size-[2.75rem] rounded-md',
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
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
