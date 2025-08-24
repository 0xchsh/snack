'use client'

import { useState, useEffect, useCallback } from 'react'
import { savedListsDB } from '@/lib/saved-lists'
import type { SavedListWithDetails, SavedListCard } from '@/types'
import { useAuth } from './useAuth'

/**
 * Optimized hook for saved lists functionality
 * Implements client-side caching and real-time updates
 */
export function useSavedLists() {
  const { user } = useAuth()
  const [savedLists, setSavedLists] = useState<SavedListWithDetails[]>([])
  const [savedListCards, setSavedListCards] = useState<SavedListCard[]>([])
  const [loading, setLoading] = useState(false)
  const [popularLists, setPopularLists] = useState<SavedListCard[]>([])

  // Cache for fast "is saved" checks
  const [savedListsCache, setSavedListsCache] = useState<Set<string>>(new Set())

  // Load user's saved lists
  const loadSavedLists = useCallback(async () => {
    if (!user) {
      setSavedLists([])
      setSavedListCards([])
      setSavedListsCache(new Set())
      return
    }

    setLoading(true)
    try {
      const [savedListsData, savedCardsData] = await Promise.all([
        savedListsDB.getUserSavedLists(user.id),
        savedListsDB.getUserSavedListCards(user.id)
      ])

      setSavedLists(savedListsData)
      setSavedListCards(savedCardsData)
      
      // Update cache for fast lookups
      const savedIds = new Set(savedListsData.map(save => save.list_id))
      setSavedListsCache(savedIds)
      
      console.log(`Loaded ${savedListsData.length} saved lists for user`)
    } catch (error) {
      console.error('Failed to load saved lists:', error)
      setSavedLists([])
      setSavedListCards([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load popular lists for discovery
  const loadPopularLists = useCallback(async () => {
    try {
      const popular = await savedListsDB.getPopularLists(20)
      
      // If user is logged in, check which ones they've saved
      if (user && popular.length > 0) {
        const listIds = popular.map(list => list.list_id)
        const savedStatus = await savedListsDB.checkMultipleSavedLists(user.id, listIds)
        
        const popularWithSaveStatus = popular.map(list => ({
          ...list,
          is_saved: savedStatus[list.list_id] || false
        }))
        
        setPopularLists(popularWithSaveStatus)
      } else {
        setPopularLists(popular)
      }
    } catch (error) {
      console.error('Failed to load popular lists:', error)
    }
  }, [user])

  // Save a list
  const saveList = useCallback(async (listId: string, notes?: string): Promise<boolean> => {
    if (!user) return false

    try {
      await savedListsDB.saveList(user.id, listId, notes)
      
      // Update local cache
      setSavedListsCache(prev => new Set([...prev, listId]))
      
      // Reload saved lists to get updated data
      await loadSavedLists()
      
      console.log('List saved successfully:', listId)
      return true
    } catch (error) {
      console.error('Failed to save list:', error)
      return false
    }
  }, [user, loadSavedLists])

  // Unsave a list
  const unsaveList = useCallback(async (listId: string): Promise<boolean> => {
    if (!user) return false

    try {
      await savedListsDB.unsaveList(user.id, listId)
      
      // Update local cache
      setSavedListsCache(prev => {
        const newSet = new Set(prev)
        newSet.delete(listId)
        return newSet
      })
      
      // Reload saved lists to get updated data
      await loadSavedLists()
      
      console.log('List unsaved successfully:', listId)
      return true
    } catch (error) {
      console.error('Failed to unsave list:', error)
      return false
    }
  }, [user, loadSavedLists])

  // Fast check if list is saved (uses cache)
  const isListSaved = useCallback((listId: string): boolean => {
    return savedListsCache.has(listId)
  }, [savedListsCache])

  // Get save count for a list
  const getListSaveCount = useCallback(async (listId: string): Promise<number> => {
    return await savedListsDB.getListSaveCount(listId)
  }, [])

  // Toggle save status
  const toggleSaveList = useCallback(async (listId: string, notes?: string): Promise<boolean> => {
    const isSaved = isListSaved(listId)
    if (isSaved) {
      return await unsaveList(listId)
    } else {
      return await saveList(listId, notes)
    }
  }, [isListSaved, saveList, unsaveList])

  // Load data on mount and user change
  useEffect(() => {
    loadSavedLists()
  }, [loadSavedLists])

  useEffect(() => {
    loadPopularLists()
  }, [loadPopularLists])

  return {
    // Data
    savedLists,
    savedListCards,
    popularLists,
    loading,
    
    // Actions
    saveList,
    unsaveList,
    toggleSaveList,
    
    // Utilities
    isListSaved,
    getListSaveCount,
    
    // Refresh
    refreshSavedLists: loadSavedLists,
    refreshPopularLists: loadPopularLists
  }
}