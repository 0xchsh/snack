'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Stats {
  lists: number
  links: number
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toLocaleString()
}

function AnimatedNumber({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    // Animate the number counting up
    const duration = 1500
    const steps = 30
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), value)
      setDisplayValue(current)

      if (step >= steps) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-4xl md:text-5xl font-bold text-neutral-900 tabular-nums"
      >
        {formatNumber(displayValue)}
      </motion.div>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  )
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Don't render if loading or no stats
  if (isLoading || !stats || (stats.lists === 0 && stats.links === 0)) {
    return null
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="py-12 px-4"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-12 md:gap-16">
          <AnimatedNumber value={stats.lists} label="lists created" />
          <div className="w-px h-12 bg-neutral-200" />
          <AnimatedNumber value={stats.links} label="links saved" />
        </div>
      </div>
    </motion.section>
  )
}
