import { useState, useEffect, useCallback } from 'react'
import { ListWithLinks, CreateListForm, LinkInsert } from '@/types'

export function useLists() {
  const [lists, setLists] = useState<ListWithLinks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all lists
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/lists')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch lists')
      }
      
      setLists(result.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching lists:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch lists')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new list
  const createList = useCallback(async (data: CreateListForm) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create list')
      }
      
      setLists(prev => [result.data, ...prev])
      return result.data
    } catch (err) {
      console.error('Error creating list:', err)
      throw err
    }
  }, [])

  // Update a list
  const updateList = useCallback(async (listId: string, updates: Partial<ListWithLinks>) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update list')
      }
      
      setLists(prev => prev.map(list => 
        list.id === listId ? result.data : list
      ))
      
      return result.data
    } catch (err) {
      console.error('Error updating list:', err)
      throw err
    }
  }, [])

  // Delete a list
  const deleteList = useCallback(async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete list')
      }
      
      setLists(prev => prev.filter(list => list.id !== listId))
    } catch (err) {
      console.error('Error deleting list:', err)
      throw err
    }
  }, [])

  // Add a link to a list
  const addLink = useCallback(async (listId: string, link: Omit<LinkInsert, 'list_id'>) => {
    try {
      const response = await fetch(`/api/lists/${listId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(link)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add link')
      }
      
      // Re-fetch the list to get updated positions for all links
      await fetchLists()
      
      return result.data
    } catch (err) {
      console.error('Error adding link:', err)
      throw err
    }
  }, [])

  // Remove a link from a list
  const removeLink = useCallback(async (listId: string, linkId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}/links/${linkId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to remove link')
      }
      
      setLists(prev => prev.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            links: list.links.filter(link => link.id !== linkId)
          }
        }
        return list
      }))
    } catch (err) {
      console.error('Error removing link:', err)
      throw err
    }
  }, [])

  // Reorder links in a list
  const reorderLinks = useCallback(async (listId: string, linkIds: string[]) => {
    try {
      const response = await fetch(`/api/lists/${listId}/links`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds })
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to reorder links')
      }
      
      // Update local state to reflect new order
      setLists(prev => prev.map(list => {
        if (list.id === listId) {
          const reorderedLinks = linkIds
            .map(id => list.links.find(link => link.id === id))
            .filter(Boolean) as typeof list.links
          
          return {
            ...list,
            links: reorderedLinks
          }
        }
        return list
      }))
    } catch (err) {
      console.error('Error reordering links:', err)
      throw err
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    addLink,
    removeLink,
    reorderLinks,
    refetch: fetchLists
  }
}