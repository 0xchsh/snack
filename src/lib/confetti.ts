import confetti from 'canvas-confetti'

const BRAND_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7']

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function celebrate() {
  if (prefersReducedMotion()) return
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    origin: { y: 0.35 },
    colors: BRAND_COLORS,
    scalar: 0.9,
    ticks: 180,
  })
}

export function sparkle(origin?: { x: number; y: number }) {
  if (prefersReducedMotion()) return
  confetti({
    particleCount: 18,
    spread: 50,
    startVelocity: 25,
    origin: origin ?? { x: 0.5, y: 0.3 },
    colors: BRAND_COLORS,
    scalar: 0.7,
    ticks: 120,
    gravity: 1.1,
  })
}
