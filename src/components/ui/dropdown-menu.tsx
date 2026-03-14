'use client'

import * as React from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'

import { cn } from '@/lib/utils'

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: MenuPrimitive.Trigger.Props & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return (
      <MenuPrimitive.Trigger
        data-slot="dropdown-menu-trigger"
        render={children}
        {...props}
      />
    )
  }
  return (
    <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props}>
      {children}
    </MenuPrimitive.Trigger>
  )
}

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            'z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none',
            'data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95',
            'data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn(
        'px-1.5 py-1 text-xs font-medium text-muted-foreground',
        inset && 'pl-7',
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  asChild,
  children,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: 'default' | 'destructive'
  asChild?: boolean
}) {
  const itemClassName = cn(
    'relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none',
    'focus:bg-accent focus:text-accent-foreground',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    inset && 'pl-7',
    className
  )

  if (asChild && React.isValidElement(children)) {
    return (
      <MenuPrimitive.Item
        data-slot="dropdown-menu-item"
        data-variant={variant}
        className={itemClassName}
        render={children}
        {...props}
      />
    )
  }

  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={itemClassName}
      {...props}
    >
      {children}
    </MenuPrimitive.Item>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
}
