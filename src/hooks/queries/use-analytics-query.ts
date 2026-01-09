'use client'

import { useQuery } from '@tanstack/react-query'

// ============================================================================
// Types
// ============================================================================

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  totalSaves: number
  listStats: Record<string, { views: number; clicks: number }>
}

// ============================================================================
// Query Keys
// ============================================================================

export const analyticsKeys = {
  stats: ['analytics', 'stats'] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch analytics stats for user's lists
 */
export function useAnalyticsStatsQuery() {
  return useQuery({
    queryKey: analyticsKeys.stats,
    queryFn: async (): Promise<AnalyticsData | null> => {
      const response = await fetch('/api/analytics/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const text = await response.text()
      if (!text) return null
      const result = JSON.parse(text)
      return result.data || null
    },
    // Analytics data can be stale for longer
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
