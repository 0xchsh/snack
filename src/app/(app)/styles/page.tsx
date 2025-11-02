'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, BarChart3, Bookmark, Copy, ExternalLink, Moon, MoreVertical, Settings, Sun, User } from 'lucide-react'

import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Textarea } from '@/components/ui'
import { ThemeToggle } from '@/components/theme-toggle'

export default function StylesPage() {
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')

  const colorTokens = [
    { name: 'background', class: 'bg-background', text: 'text-foreground' },
    { name: 'foreground', class: 'bg-foreground', text: 'text-background' },
    { name: 'primary', class: 'bg-primary', text: 'text-primary-foreground' },
    { name: 'secondary', class: 'bg-secondary', text: 'text-secondary-foreground' },
    { name: 'muted', class: 'bg-muted', text: 'text-muted-foreground' },
    { name: 'accent', class: 'bg-accent', text: 'text-accent-foreground' },
    { name: 'destructive', class: 'bg-destructive', text: 'text-destructive-foreground' },
    { name: 'border', class: 'bg-border', text: 'text-foreground' },
    { name: 'input', class: 'bg-input', text: 'text-foreground' },
    { name: 'ring', class: 'bg-ring', text: 'text-foreground' },
  ]

  const textColorTokens = [
    { name: 'foreground', class: 'text-foreground' },
    { name: 'primary', class: 'text-primary' },
    { name: 'secondary-foreground', class: 'text-secondary-foreground' },
    { name: 'muted-foreground', class: 'text-muted-foreground' },
    { name: 'accent-foreground', class: 'text-accent-foreground' },
  ]

  const chartColors = [
    { name: 'chart-1', class: 'bg-chart-1' },
    { name: 'chart-2', class: 'bg-chart-2' },
    { name: 'chart-3', class: 'bg-chart-3' },
    { name: 'chart-4', class: 'bg-chart-4' },
    { name: 'chart-5', class: 'bg-chart-5' },
  ]

  const spacingScale = [
    { name: 'nav-x', value: '24px (1.5rem)', class: 'px-nav-x' },
    { name: 'nav-y', value: '24px (1.5rem)', class: 'py-nav-y' },
    { name: 'nav-x-mobile', value: '16px (1rem)', class: 'px-nav-x-mobile' },
    { name: 'nav-y-mobile', value: '12px (0.75rem)', class: 'py-nav-y-mobile' },
  ]

  const sizingScale = [
    { name: 'logo-app', value: '32px (2rem)', class: 'w-logo-app h-logo-app' },
    { name: 'logo-marketing', value: '40px (2.5rem)', class: 'w-logo-marketing h-logo-marketing' },
    { name: 'icon-button', value: '42px (2.625rem)', class: 'w-icon-button h-icon-button' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-nav-x py-nav-y">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <h1 className="text-xl font-semibold">Design System</h1>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-nav-x py-12 max-w-container-app">

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Typography</h2>
          <div className="space-y-4 bg-secondary p-6 rounded-lg border border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Display / 4xl / Bold</p>
              <h1 className="text-4xl font-bold text-foreground">The quick brown fox jumps over the lazy dog</h1>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Heading 1 / 3xl / Bold</p>
              <h1 className="text-3xl font-bold text-foreground">The quick brown fox jumps over the lazy dog</h1>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Heading 2 / 2xl / Bold</p>
              <h2 className="text-2xl font-bold text-foreground">The quick brown fox jumps over the lazy dog</h2>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Heading 3 / xl / Bold</p>
              <h3 className="text-xl font-bold text-foreground">The quick brown fox jumps over the lazy dog</h3>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Heading 4 / lg / Semibold</p>
              <h4 className="text-lg font-semibold text-foreground">The quick brown fox jumps over the lazy dog</h4>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Body / base / Regular</p>
              <p className="text-base font-normal text-foreground">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Body / base / Medium</p>
              <p className="text-base font-medium text-foreground">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Small / sm / Regular</p>
              <p className="text-sm font-normal text-foreground">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Extra Small / xs / Regular</p>
              <p className="text-xs font-normal text-foreground">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Monospace / base / Regular</p>
              <code className="text-base font-mono text-foreground">The quick brown fox jumps over the lazy dog</code>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Color Palette</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Semantic Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {colorTokens.map((token) => (
                  <div key={token.name} className="space-y-2">
                    <div className={`${token.class} ${token.text} h-24 rounded-lg border border-border flex items-center justify-center font-medium`}>
                      Aa
                    </div>
                    <p className="text-sm font-mono text-muted-foreground">{token.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Text Colors</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-3">
                {textColorTokens.map((token) => (
                  <div key={token.name} className="flex items-center gap-4">
                    <div className={`${token.class} font-medium flex-1`}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <p className="text-xs font-mono text-muted-foreground w-48">{token.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Chart Colors</h3>
              <div className="flex gap-4">
                {chartColors.map((color) => (
                  <div key={color.name} className="flex-1 space-y-2">
                    <div className={`${color.class} h-16 rounded-lg border border-border`} />
                    <p className="text-xs font-mono text-muted-foreground text-center">{color.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Buttons</h2>
          <div className="space-y-8">

            {/* Primary Button */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Primary Button</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <Button size="lg">
                  Primary Button
                </Button>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Button size="lg">Primary Button</Button>`}
                </pre>
              </div>
            </div>

            {/* Secondary Button */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Secondary Button</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <Button size="lg" variant="secondary">
                  Secondary Button
                </Button>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Button size="lg" variant="secondary">Secondary Button</Button>`}
                </pre>
              </div>
            </div>

            {/* Text Buttons with Icons */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Text Buttons with Icons</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border">
                <div className="flex flex-wrap gap-3">
                  <Button variant="muted" className="gap-2 font-medium">
                    View
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="muted" className="gap-2 font-medium">
                    Copy
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button asChild variant="muted" className="gap-2 font-medium">
                    <Link href="#">
                      Saved
                      <Bookmark className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="muted" className="gap-2 font-medium">
                    <Link href="#">
                      Stats
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto mt-4">
{`<Button variant="muted" className="gap-2 font-medium">
  View
  <ExternalLink className="w-4 h-4" />
</Button>`}
                </pre>
              </div>
            </div>

            {/* Icon Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Icon Buttons</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border">
                <div className="flex flex-wrap gap-3">
                  <Button variant="muted" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                  <Button variant="muted" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button variant="muted" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                  <Button variant="muted" size="icon">
                    <Sun className="w-5 h-5" />
                  </Button>
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto mt-4">
{`<Button variant="muted" size="icon">
  <User className="w-5 h-5" />
</Button>`}
                </pre>
              </div>
            </div>

            {/* Destructive Button */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Destructive Button</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <Button size="lg" variant="destructive">
                  Delete
                </Button>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Button size="lg" variant="destructive">Delete</Button>`}
                </pre>
              </div>
            </div>

          </div>
        </section>

        {/* Form Components */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Form Components</h2>
          <div className="space-y-8">

            {/* Text Input */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Text Input</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="max-w-md">
                  <Label htmlFor="text-input" className="mb-2 block">
                    Label
                  </Label>
                  <Input
                    id="text-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter text..."
                    size="sm"
                  />
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Label htmlFor="text-input">Label</Label>
<Input id="text-input" placeholder="Enter text..." size="sm" />`}
                </pre>
              </div>
            </div>

            {/* Textarea */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Textarea</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="max-w-md">
                  <Label htmlFor="textarea" className="mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="textarea"
                    value={textareaValue}
                    onChange={(e) => setTextareaValue(e.target.value)}
                    placeholder="Enter description..."
                    rows={4}
                  />
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Label htmlFor="textarea">Description</Label>
<Textarea id="textarea" rows={4} placeholder="Enter description..." />`}
                </pre>
              </div>
            </div>

            {/* Alternative Input Style (Secondary BG) */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Input (Secondary Background)</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="max-w-md">
                  <Label htmlFor="alt-input" className="mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="alt-input"
                    type="email"
                    placeholder="name@example.com"
                    variant="secondary"
                  />
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Input
  id="alt-input"
  type="email"
  placeholder="name@example.com"
  variant="secondary"
/>`}
                </pre>
              </div>
            </div>

            {/* Radio Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Radio Buttons</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="max-w-md space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="radio-demo" className="w-4 h-4 text-primary focus:ring-primary" defaultChecked />
                    <span className="text-foreground">Option 1</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="radio-demo" className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-foreground">Option 2</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="radio-demo" className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="text-foreground">Option 3</span>
                  </label>
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`className="w-4 h-4 text-primary focus:ring-primary"`}
                </pre>
              </div>
            </div>

            {/* Checkbox */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Checkbox</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="max-w-md space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary focus:ring-primary rounded" defaultChecked />
                    <span className="text-foreground">Accept terms and conditions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary focus:ring-primary rounded" />
                    <span className="text-foreground">Subscribe to newsletter</span>
                  </label>
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`className="w-4 h-4 text-primary focus:ring-primary
          rounded"`}
                </pre>
              </div>
            </div>

          </div>
        </section>

        {/* Spacing & Sizing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Spacing & Sizing</h2>
          <div className="space-y-6">

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Spacing Scale</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                {spacingScale.map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="bg-primary/20 border border-primary">
                      <div className={`${item.class} bg-primary h-8`} />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Sizing Scale</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                {sizingScale.map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className={`${item.class} bg-primary/20 border border-primary`} />
                    <div>
                      <p className="text-sm font-mono text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Border Radius</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border">
                <div className="flex flex-wrap gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-24 h-24 bg-primary/20 border border-primary rounded-sm" />
                    <p className="text-xs font-mono text-muted-foreground">rounded-sm</p>
                    <p className="text-xs text-muted-foreground">0.125rem</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-24 h-24 bg-primary/20 border border-primary rounded" />
                    <p className="text-xs font-mono text-muted-foreground">rounded</p>
                    <p className="text-xs text-muted-foreground">0.25rem</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-24 h-24 bg-primary/20 border border-primary rounded-lg" />
                    <p className="text-xs font-mono text-muted-foreground">rounded-lg</p>
                    <p className="text-xs text-muted-foreground">0.5rem</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-24 h-24 bg-primary/20 border border-primary rounded-xl" />
                    <p className="text-xs font-mono text-muted-foreground">rounded-xl</p>
                    <p className="text-xs text-muted-foreground">0.75rem</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-24 h-24 bg-primary/20 border border-primary rounded-2xl" />
                    <p className="text-xs font-mono text-muted-foreground">rounded-2xl</p>
                    <p className="text-xs text-muted-foreground">1rem</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* UI Patterns */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">UI Patterns</h2>
          <div className="space-y-8">

            {/* Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Card</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>
                      This is a card component with a title, description, and action button.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button>Action</Button>
                  </CardFooter>
                </Card>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting copy.</CardDescription>
  </CardHeader>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`}
                </pre>
              </div>
            </div>

            {/* Alert/Banner */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Alerts</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg max-w-md">
                  Success! Your changes have been saved.
                </div>
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg max-w-md">
                  Error! Something went wrong.
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-lg max-w-md">
                  Info: This is an informational message.
                </div>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Dropdown Menu</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border">
                <div className="bg-background border border-border rounded-lg shadow-lg py-2 max-w-xs">
                  <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors">
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors">
                    Settings
                  </button>
                  <div className="border-t border-border my-1" />
                  <button className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors">
                    Logout
                  </button>
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto mt-4">
{`Container:
className="bg-background border border-border
          rounded-lg shadow-lg py-2"

Menu Item:
className="w-full px-4 py-2 text-left text-sm
          text-foreground hover:bg-accent
          transition-colors"`}
                </pre>
              </div>
            </div>

            {/* Loading States */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Loading States</h3>
              <div className="bg-secondary p-6 rounded-lg border border-border space-y-4">
                <div className="space-y-3 max-w-md">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`className="h-4 bg-muted rounded animate-pulse"`}
                </pre>
              </div>
            </div>

          </div>
        </section>

        {/* Icons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Icons (Lucide React)</h2>
          <div className="bg-secondary p-6 rounded-lg border border-border">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
              <div className="flex flex-col items-center gap-2">
                <User className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">User</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Settings className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">Settings</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Bookmark className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">Bookmark</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">BarChart3</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Copy className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">Copy</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ExternalLink className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">External</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Sun className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">Sun</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Moon className="w-6 h-6 text-foreground" />
                <p className="text-xs text-muted-foreground">Moon</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              View all icons at <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lucide.dev</a>
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
