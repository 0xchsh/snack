'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ListWithLinks, LinkCreatePayload, CreateListForm } from '@/types'

// ============================================================================
// Query Keys - Centralized for consistency
// ============================================================================

export const listKeys = {
  all: ['lists'] as const,
  list: (id: string) => ['lists', id] as const,
  publicList: (username: string, listId: string) => ['lists', 'public', username, listId] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all user lists
 */
export function useListsQuery() {
  return useQuery({
    queryKey: listKeys.all,
    queryFn: async (): Promise<ListWithLinks[]> => {
      const response = await fetch('/api/lists')
      if (!response.ok) {
        throw new Error('Failed to fetch lists')
      }
      const result = await response.json()
      return result.data || []
    },
  })
}

/**
 * Fetch a single list by ID
 */
export function useListQuery(listId: string | undefined) {
  return useQuery({
    queryKey: listKeys.list(listId || ''),
    queryFn: async (): Promise<ListWithLinks> => {
      const response = await fetch(`/api/lists/${listId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch list')
      }
      const result = await response.json()
      return result.data
    },
    enabled: !!listId,
  })
}

/**
 * Fetch a public list by username and listId with placeholderData from cache
 * This provides instant navigation when coming from the dashboard
 */
export function usePublicListQuery(
  username: string | undefined,
  listId: string | undefined
) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: listKeys.publicList(username || '', listId || ''),
    queryFn: async (): Promise<ListWithLinks> => {
      const encodedUsername = encodeURIComponent(username || '')
      const encodedListId = encodeURIComponent(listId || '')

      // Try the username/listId endpoint first
      const response = await fetch(`/api/users/${encodedUsername}/lists/${encodedListId}`)

      if (response.ok) {
        const result = await response.json()
        return result.data
      }

      // Fall back to generic list endpoint for legacy IDs
      if (response.status === 404) {
        const fallbackResponse = await fetch(`/api/lists/${encodedListId}`)
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json()
          return fallbackResult.data
        }
      }

      if (response.status === 403) {
        throw new Error('This list is private')
      }

      throw new Error('List not found')
    },
    enabled: !!username && !!listId,
    // Use cached data from dashboard while fetching fresh data
    placeholderData: () => {
      // Try to find in the all lists cache (from dashboard)
      const allLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)
      const cachedList = allLists?.find(
        (list) => list.id === listId || list.public_id === listId
      )
      if (cachedList) return cachedList

      // Try individual list cache (from prefetch)
      const individualList = queryClient.getQueryData<ListWithLinks>(
        listKeys.list(listId || '')
      )
      return individualList
    },
    // Keep showing placeholder while refetching
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new empty list
 */
export function useCreateEmptyListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<ListWithLinks> => {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        throw new Error('Failed to create list')
      }
      const result = await response.json()
      return result.data
    },
    onSuccess: (newList) => {
      // Add new list to the top of the cache
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old ? [newList, ...old] : [newList]
      )
    },
  })
}

/**
 * Create a new list with form data
 */
export function useCreateListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: CreateListForm): Promise<ListWithLinks> => {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        throw new Error('Failed to create list')
      }
      const result = await response.json()
      return result.data
    },
    onSuccess: (newList) => {
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old ? [newList, ...old] : [newList]
      )
    },
  })
}

/**
 * Update a list
 */
export function useUpdateListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      updates,
    }: {
      listId: string
      updates: Partial<ListWithLinks>
    }): Promise<ListWithLinks> => {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update list')
      }
      const result = await response.json()
      return result.data
    },
    onMutate: async ({ listId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: listKeys.all })

      // Snapshot previous value
      const previousLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)

      // Optimistic update
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.map((list) => (list.id === listId ? { ...list, ...updates } : list))
      )

      return { previousLists }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists)
      }
    },
    onSettled: (_data, _error, { listId }) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: listKeys.list(listId) })
    },
  })
}

/**
 * Delete a list
 */
export function useDeleteListMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listId: string): Promise<void> => {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete list')
      }
    },
    onMutate: async (listId) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })

      const previousLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)

      // Optimistic remove
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.filter((list) => list.id !== listId)
      )

      return { previousLists }
    },
    onError: (_err, _listId, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists)
      }
    },
  })
}

/**
 * Add a link to a list
 */
export function useAddLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      link,
    }: {
      listId: string
      link: LinkCreatePayload
    }): Promise<ListWithLinks> => {
      const response = await fetch(`/api/lists/${listId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link),
      })
      if (!response.ok) {
        throw new Error('Failed to add link')
      }
      const result = await response.json()
      return result.data
    },
    onMutate: async ({ listId, link }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })

      const previousLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)

      // Optimistic update - add temp link at position 0
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.map((list) =>
          list.id === listId
            ? {
                ...list,
                links: [
                  {
                    id: `temp-${Date.now()}`,
                    list_id: listId,
                    url: link.url,
                    title: link.title || link.url,
                    description: link.description || null,
                    image_url: link.image_url || null,
                    favicon_url: link.favicon_url || null,
                    position: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  ...list.links,
                ],
              }
            : list
        )
      )

      return { previousLists }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists)
      }
    },
    onSuccess: (updatedList, { listId }) => {
      // Replace with server response (has real IDs, OG data)
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.map((list) => (list.id === listId ? updatedList : list))
      )
    },
  })
}

/**
 * Delete a link from a list
 */
export function useDeleteLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      linkId,
    }: {
      listId: string
      linkId: string
    }): Promise<void> => {
      const response = await fetch(`/api/lists/${listId}/links/${linkId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete link')
      }
    },
    onMutate: async ({ listId, linkId }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })

      const previousLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)

      // Optimistic remove
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.map((list) =>
          list.id === listId
            ? { ...list, links: list.links.filter((l) => l.id !== linkId) }
            : list
        )
      )

      return { previousLists }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists)
      }
    },
  })
}

/**
 * Reorder links in a list
 */
export function useReorderLinksMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      linkIds,
    }: {
      listId: string
      linkIds: string[]
    }): Promise<void> => {
      const response = await fetch(`/api/lists/${listId}/links`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to reorder links')
      }
    },
    onMutate: async ({ listId, linkIds }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })

      const previousLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)

      // Optimistic reorder
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.map((list) => {
          if (list.id !== listId) return list
          const reorderedLinks = linkIds
            .map((id) => list.links.find((l) => l.id === id))
            .filter((l): l is NonNullable<typeof l> => l !== undefined)
          return { ...list, links: reorderedLinks }
        })
      )

      return { previousLists }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists)
      }
    },
  })
}

/**
 * Refresh a single link's metadata (OG data)
 */
export function useRefreshLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      linkId,
      updates,
    }: {
      listId: string
      linkId: string
      updates: {
        title?: string
        description?: string | null
        image_url?: string | null
        favicon_url?: string | null
      }
    }): Promise<void> => {
      const response = await fetch(`/api/lists/${listId}/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update link')
      }
    },
    onMutate: async ({ listId, linkId, updates }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.all })

      const previousLists = queryClient.getQueryData<ListWithLinks[]>(listKeys.all)

      // Optimistic update
      queryClient.setQueryData<ListWithLinks[]>(listKeys.all, (old) =>
        old?.map((list) =>
          list.id === listId
            ? {
                ...list,
                links: list.links.map((l) =>
                  l.id === linkId ? { ...l, ...updates } : l
                ),
              }
            : list
        )
      )

      return { previousLists }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(listKeys.all, context.previousLists)
      }
    },
  })
}
