'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ListWithLinks, CreateListForm } from '@/types'
import { supabaseListDB } from '@/lib/supabase-lists'
import { useAuth } from '@/hooks/useAuth'

interface ListsContextType {
  // State
  lists: ListWithLinks[]
  loading: boolean
  error: string | null
  
  // List operations
  createEmptyList: () => Promise<ListWithLinks>
  createList: (formData: CreateListForm) => Promise<ListWithLinks>
  updateList: (listId: string, updates: Partial<ListWithLinks>) => Promise<ListWithLinks | null>
  deleteList: (listId: string) => Promise<boolean>
  getListById: (listId: string) => ListWithLinks | null
  refreshLists: () => void
  
  // Link operations
  addLinkToList: (listId: string, linkData: { url: string; title?: string }) => Promise<ListWithLinks | null>
  removeLinkFromList: (listId: string, linkId: string) => Promise<ListWithLinks | null>
}

const ListsContext = createContext<ListsContextType | undefined>(undefined)

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ListWithLinks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Load user's lists when user changes
  useEffect(() => {
    const loadUserLists = async () => {
      if (!user) {
        setLists([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Loading lists for user:', user.id)
        
        // Load user's lists directly from Supabase
        const userLists = await supabaseListDB.getUserLists(user.id)
        setLists(userLists)
        setError(null)
        
        console.log('Loaded lists from Supabase:', userLists)
      } catch (err) {
        console.error('Error loading lists:', err)
        setError('Failed to load lists')
        setLists([])
      } finally {
        setLoading(false)
      }
    }

    loadUserLists()
  }, [user])

  // Refresh lists from storage
  const refreshLists = async () => {
    if (user) {
      try {
        const userLists = await supabaseListDB.getUserLists(user.id)
        setLists(userLists)
        console.log('Refreshed lists from Supabase:', userLists)
      } catch (err) {
        console.error('Error refreshing lists:', err)
        setError('Failed to refresh lists')
      }
    }
  }

  // Create a new empty list
  const createEmptyList = async (): Promise<ListWithLinks> => {
    if (!user) {
      throw new Error('User must be authenticated to create lists')
    }

    try {
      setLoading(true)
      const newList = await supabaseListDB.createEmptyList(user)
      
      // Update local state
      setLists(prev => [...prev, newList])
      setError(null)
      
      console.log('Created empty list in Supabase:', newList)
      return newList
    } catch (err) {
      console.error('Error creating empty list:', err)
      setError('Failed to create list')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Create a list from form data
  const createList = async (formData: CreateListForm): Promise<ListWithLinks> => {
    if (!user) {
      throw new Error('User must be authenticated to create lists')
    }

    try {
      setLoading(true)
      const newList = await supabaseListDB.createList(formData, user)
      
      // Update local state
      setLists(prev => [...prev, newList])
      setError(null)
      
      console.log('Created list in Supabase:', newList)
      return newList
    } catch (err) {
      console.error('Error creating list:', err)
      setError('Failed to create list')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update an existing list
  const updateList = async (listId: string, updates: Partial<ListWithLinks>): Promise<ListWithLinks | null> => {
    try {
      const updatedList = await supabaseListDB.updateList(listId, updates)
      
      if (updatedList) {
        // Update local state
        setLists(prev => prev.map(list => 
          list.id === listId ? updatedList : list
        ))
        setError(null)
        console.log('Updated list in Supabase:', updatedList)
      }
      
      return updatedList
    } catch (err) {
      console.error('Error updating list:', err)
      setError('Failed to update list')
      return null
    }
  }

  // Delete a list
  const deleteList = async (listId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User must be authenticated to delete lists')
    }

    try {
      const success = await supabaseListDB.deleteList(listId, user.id)
      
      if (success) {
        // Update local state
        setLists(prev => prev.filter(list => list.id !== listId))
        setError(null)
        console.log('Deleted list from Supabase:', listId)
      }
      
      return success
    } catch (err) {
      console.error('Error deleting list:', err)
      setError('Failed to delete list')
      return false
    }
  }

  // Get a specific list by ID
  const getListById = (listId: string): ListWithLinks | null => {
    return lists.find(list => list.id === listId) || null
  }

  // Add a link to a list
  const addLinkToList = async (listId: string, linkData: { url: string; title?: string }): Promise<ListWithLinks | null> => {
    try {
      const updatedList = await supabaseListDB.addLinkToList(listId, linkData)
      
      if (updatedList) {
        // Update local state
        setLists(prev => prev.map(list => 
          list.id === listId ? updatedList : list
        ))
        setError(null)
        console.log('Added link to list in Supabase:', linkData)
      }
      
      return updatedList
    } catch (err) {
      console.error('Error adding link:', err)
      setError('Failed to add link')
      return null
    }
  }

  // Remove a link from a list
  const removeLinkFromList = async (listId: string, linkId: string): Promise<ListWithLinks | null> => {
    try {
      const updatedList = await supabaseListDB.removeLinkFromList(listId, linkId)
      
      if (updatedList) {
        // Update local state
        setLists(prev => prev.map(list => 
          list.id === listId ? updatedList : list
        ))
        setError(null)
        console.log('Removed link from list in Supabase:', linkId)
      }
      
      return updatedList
    } catch (err) {
      console.error('Error removing link:', err)
      setError('Failed to remove link')
      return null
    }
  }

  const value: ListsContextType = {
    // State
    lists,
    loading,
    error,
    
    // List operations
    createEmptyList,
    createList,
    updateList,
    deleteList,
    getListById,
    refreshLists,
    
    // Link operations
    addLinkToList,
    removeLinkFromList,
  }

  return (
    <ListsContext.Provider value={value}>
      {children}
    </ListsContext.Provider>
  )
}

export function useLists() {
  const context = useContext(ListsContext)
  if (context === undefined) {
    throw new Error('useLists must be used within a ListsProvider')
  }
  return context
}