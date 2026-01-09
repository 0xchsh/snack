'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ListWithLinks } from '@/types'

// ============================================================================
// Query Keys
// ============================================================================

export const savedListKeys = {
  all: ['savedLists'] as const,
  isSaved: (listId: string) => ['savedLists', 'isSaved', listId] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all saved lists for current user
 */
export function useSavedListsQuery() {
  return useQuery({
    queryKey: savedListKeys.all,
    queryFn: async (): Promise<ListWithLinks[]> => {
      const response = await fetch('/api/saved-lists')
      if (!response.ok) {
        throw new Error('Failed to fetch saved lists')
      }
      const text = await response.text()
      if (!text) return []
      const result = JSON.parse(text)
      return result.data || []
    },
  })
}

/**
 * Check if a specific list is saved
 */
export function useIsSavedQuery(listId: string | undefined) {
  return useQuery({
    queryKey: savedListKeys.isSaved(listId || ''),
    queryFn: async (): Promise<boolean> => {
      const response = await fetch(`/api/lists/${listId}/save`)
      if (!response.ok) {
        return false
      }
      const result = await response.json()
      return result.data?.isSaved || false
    },
    enabled: !!listId,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Save a list
 */
export function useSaveListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listId: string): Promise<{ save_count: number }> => {
      const response = await fetch(`/api/lists/${listId}/save`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save list')
      }
      const result = await response.json()
      return result.data
    },
    onSuccess: (_data, listId) => {
      // Invalidate saved lists to refetch
      queryClient.invalidateQueries({ queryKey: savedListKeys.all })
      // Update the isSaved status for this specific list
      queryClient.setQueryData(savedListKeys.isSaved(listId), true)
    },
  })
}

/**
 * Unsave a list
 */
export function useUnsaveListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listId: string): Promise<{ save_count: number }> => {
      const response = await fetch(`/api/lists/${listId}/save`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unsave list')
      }
      const result = await response.json()
      return result.data
    },
    onMutate: async (listId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: savedListKeys.all })

      // Snapshot previous value
      const previousSavedLists = queryClient.getQueryData<ListWithLinks[]>(savedListKeys.all)

      // Optimistic remove
      queryClient.setQueryData<ListWithLinks[]>(savedListKeys.all, (old) =>
        old?.filter((list) => list.id !== listId)
      )

      // Update isSaved status
      queryClient.setQueryData(savedListKeys.isSaved(listId), false)

      return { previousSavedLists }
    },
    onError: (_err, listId, context) => {
      // Rollback on error
      if (context?.previousSavedLists) {
        queryClient.setQueryData(savedListKeys.all, context.previousSavedLists)
      }
      queryClient.setQueryData(savedListKeys.isSaved(listId), true)
    },
  })
}
