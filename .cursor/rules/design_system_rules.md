# Figma MCP Design System Integration Rules

This document provides comprehensive guidance for integrating Figma designs with this Next.js codebase using the Model Context Protocol (MCP).

## Project Overview

**Snack v4** - A social platform for creating and sharing curated lists of links. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack Summary

- **Frontend Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5.6+ (strict mode)
- **Styling Framework**: Tailwind CSS 3.4 with CSS Variables
- **UI Components**: Custom components using Radix UI primitives
- **Icons**: Lucide React icon library
- **Animation**: Framer Motion and Tailwind CSS Animate
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth
- **Package Manager**: npm

## Design System Structure

### 1. Token Definitions

**Primary Token Location**: `src/app/globals.css` (lines 45-200)

Design tokens are defined as CSS custom properties in the `:root` and `.dark` selectors:

```css
:root {
  /* Color Tokens */
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #f97316; /* Orange-500 brand color */
  --primary-foreground: #fafafa;
  --secondary: #f5f5f5;
  --muted: #f5f5f5;
  --muted-foreground: #717171;
  --accent: #f5f5f5;
  --destructive: #e7000b;
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #a1a1a1;

  /* Typography Tokens */
  --font-sans: Geist, sans-serif;
  --font-serif: Source Serif Pro, serif;
  --font-mono: Geist Mono, monospace;

  /* Spacing & Layout Tokens */
  --radius: 100px; /* Highly rounded design system */
  --spacing: 0.25rem;
  --tracking-normal: -0.01em;

  /* Shadow Tokens */
  --shadow-sm: 0px 0px 0px 0px hsl(0 0% 0% / 0.25), 0px 1px 2px -1px hsl(0 0% 0% / 0.25);
  --shadow-md: 0px 0px 0px 0px hsl(0 0% 0% / 0.25), 0px 2px 4px -1px hsl(0 0% 0% / 0.25);
  /* ... additional shadow variations */
}
```

**Dark Mode Tokens**: Complete dark theme variant defined in `.dark` selector with adjusted color values.

**Tailwind Integration**: Tokens are mapped to Tailwind utilities in `tailwind.config.ts`:

```typescript
colors: {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
  },
  // ... complete token mapping
}
```

### 2. Component Architecture

**Component Structure**:
- `src/components/` - Main component directory
- `src/components/ui/` - Base UI component library (currently empty, components are directly in components/)
- No formal component library detected - components are custom-built

**Key Component Patterns**:
- Custom implementations using Radix UI primitives (slot pattern)
- Tailwind CSS for styling with CSS-in-JS utility approach
- TypeScript interfaces for prop definitions
- Client-side components marked with `'use client'`

**Example Component Structure** (`src/components/favicon.tsx`):
```typescript
interface FaviconProps {
  url: string
  size?: number
  className?: string
  fallbackClassName?: string
}

export function Favicon({ url, size = 20, className = '' }: FaviconProps) {
  // Component logic with error handling
}
```

### 3. Styling Approach

**CSS Methodology**: Tailwind CSS Utility-First
- **Utility Classes**: `bg-background`, `text-foreground`, `border-border`
- **Class Composition**: Using `cn()` utility function from `src/lib/utils.ts`
- **Responsive Design**: Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)

**Utility Function** (`src/lib/utils.ts`):
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**CSS Variables Pattern**:
- Design tokens as CSS custom properties
- Tailwind uses `var()` references to maintain theming
- Dark mode toggle via `class` strategy

**Custom CSS** (in `src/app/globals.css`):
- Font loading and fallbacks
- Drag-and-drop interaction styles
- Custom animations and transitions
- Ring focus states and accessibility

### 4. Icon System

**Primary Icon Library**: Lucide React (`lucide-react`)
- **Import Pattern**: Named imports from `lucide-react`
- **Usage**: `<Menu />`, `<Trash2 />`, `<RefreshCw />`
- **Customization**: Size and color via Tailwind classes

**Found in Components**: 12 files using Lucide React icons
- `Menu`, `List`, `Grid3X3`, `GripVertical`, `Trash2`, `RefreshCw`
- `MoreHorizontal`, `Clipboard`, `FileText`, `Eye`, `Link2`

**Favicon System** (`src/components/favicon.tsx`):
- Dynamic favicon loading with fallbacks
- Error handling with multiple URL attempts
- Fallback to first letter of hostname with gradient background

### 5. Asset Management

**Static Assets Location**: `public/images/`
- `favicon.png` - Site favicon
- `logo.svg` - Main logo
- `logomark.svg` - Logo mark/symbol

**Image Optimization**:
- Next.js Image component for automatic optimization
- Unoptimized flag for external favicons
- Responsive image sizing

**Asset Referencing Pattern**:
```typescript
import Image from 'next/image'

<Image
  src="/images/logo.svg"
  alt="Logo"
  width={100}
  height={100}
  className="object-cover"
/>
```

### 6. Typography System

**Font Stack**:
- **Primary**: Open Runde (with Inter fallback via Google Fonts)
- **Sans**: Geist (defined in CSS variables but not loaded)
- **Serif**: Source Serif Pro (defined but not loaded)
- **Mono**: Geist Mono (defined but not loaded)

**Font Loading**:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@font-face {
  font-family: 'Open Runde';
  src: local('Inter'), local('system-ui'), local('sans-serif');
  font-weight: 400;
  font-display: swap;
}
```

**Typography Configuration** (`tailwind.config.ts`):
```typescript
fontFamily: {
  sans: ['Open Runde', 'system-ui', 'sans-serif'],
}
```

### 7. Animation & Motion

**Animation Libraries**:
- **Framer Motion**: For complex animations and interactions
- **Tailwind CSS Animate**: For simple CSS animations

**Custom Animations** (defined in `src/app/globals.css`):
```css
/* Drag and drop animations */
.draggable-list-item {
  transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1),
              opacity 300ms ease,
              box-shadow 200ms ease;
}

/* Accordion animations */
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  }
}
```

### 8. Layout & Grid System

**Layout Components**:
- React Grid Layout for draggable interfaces
- Custom drag-and-drop styling
- Responsive container system

**Container Configuration**:
```typescript
container: {
  center: true,
  padding: "2rem",
  screens: {
    "2xl": "1400px",
  },
}
```

## Framework Integration Guidelines

### When Converting Figma Designs:

1. **Colors**: Use existing CSS custom properties from `:root` and `.dark`
2. **Typography**: Apply `font-sans` (Open Runde) as primary font family
3. **Spacing**: Use Tailwind spacing scale, base spacing unit is `--spacing: 0.25rem`
4. **Border Radius**: High radius values (`--radius: 100px`) for rounded design system
5. **Icons**: Use Lucide React icons with consistent naming patterns
6. **Components**: Create in `src/components/` with TypeScript interfaces
7. **Styling**: Use Tailwind utilities with `cn()` helper for class composition
8. **Theming**: Ensure dark mode compatibility using CSS variables

### Component Creation Pattern:

```typescript
'use client' // For interactive components

import { cn } from '@/lib/utils'
import { IconName } from 'lucide-react'

interface ComponentProps {
  className?: string
  // ... other props
}

export function ComponentName({ className, ...props }: ComponentProps) {
  return (
    <div className={cn(
      "base-styles",
      "responsive:styles",
      className
    )}>
      {/* Component content */}
    </div>
  )
}
```

### Color Usage Guidelines:

- **Primary**: `#f97316` (Orange-500) for brand elements
- **Backgrounds**: Use `bg-background` and `bg-card` variables
- **Text**: Use `text-foreground` and `text-muted-foreground` variables
- **Borders**: Use `border-border` variable
- **Interactive**: Use `bg-accent` for hover states

### Responsive Design:

- **Mobile First**: Base styles for mobile, then `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Breakpoints**: Follow Tailwind default breakpoints with custom 2xl at 1400px
- **Container**: Centered with padding, max-width responsive

This design system emphasizes simplicity, accessibility, and a highly rounded visual design with orange as the primary brand color.