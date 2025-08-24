import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SavedList, SavedListInsert, SavedListWithDetails, SavedListCard, User, ListWithUser } from '@/types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * Optimized Saved Lists Database Manager
 * Implements hybrid counter-cache system for ultra-fast queries
 */
export class OptimizedSavedListsDB {
  private supabase = supabase

  // ===============================================
  // CORE SAVED LISTS OPERATIONS (Sub-10ms target)
  // ===============================================

  /**
   * Save a list for a user (with counter cache update)
   * Target: <10ms response time
   */
  async saveList(userId: string, listId: string, notes?: string): Promise<SavedList> {
    try {
      const { data, error } = await this.supabase
        .from('saved_lists')
        .upsert({
          user_id: userId,
          list_id: listId,
          notes: notes || null,
          saved_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,list_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving list:', error)
        throw error
      }

      // Counter is updated automatically via database trigger
      console.log('List saved successfully:', listId)
      return data
    } catch (error) {
      console.error('Failed to save list:', error)
      throw error
    }
  }

  /**
   * Unsave a list for a user (with counter cache update)
   * Target: <5ms response time
   */
  async unsaveList(userId: string, listId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('saved_lists')
        .delete()
        .eq('user_id', userId)
        .eq('list_id', listId)

      if (error) {
        console.error('Error unsaving list:', error)
        throw error
      }

      // Counter is updated automatically via database trigger
      console.log('List unsaved successfully:', listId)
      return true
    } catch (error) {
      console.error('Failed to unsave list:', error)
      throw error
    }
  }

  /**
   * Check if user has saved a specific list
   * Target: <5ms response time (uses composite index)
   */
  async isListSaved(userId: string, listId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('saved_lists')
        .select('user_id')
        .eq('user_id', userId)
        .eq('list_id', listId)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error checking if list is saved:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Failed to check if list is saved:', error)
      return false
    }
  }

  // ===============================================
  // USER-CENTRIC QUERIES (Dashboard, Profile)
  // ===============================================

  /**
   * Get all lists saved by a user (with full list details)
   * Target: <20ms response time
   */
  async getUserSavedLists(userId: string): Promise<SavedListWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('saved_lists')
        .select(`
          *,
          lists (
            id, title, description, emoji, view_mode, is_public, 
            save_count, created_at, updated_at, user_id
          )
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })

      if (error) {
        console.error('Error fetching user saved lists:', error)
        throw error
      }

      return (data || []).map(save => ({
        ...save,
        list: {
          ...save.lists,
          user: { id: save.lists.user_id, username: 'User' }, // Simplified
          is_saved: true
        }
      })) as SavedListWithDetails[]
    } catch (error) {
      console.error('Failed to fetch user saved lists:', error)
      throw error
    }
  }

  /**
   * Get user's saved lists as lightweight cards (for feeds)
   * Target: <15ms response time
   */
  async getUserSavedListCards(userId: string): Promise<SavedListCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('saved_lists')
        .select(`
          list_id, saved_at, notes,
          lists (title, emoji, save_count, user_id)
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })

      if (error) {
        console.error('Error fetching saved list cards:', error)
        throw error
      }

      return (data || []).map(save => ({
        list_id: save.list_id,
        title: save.lists.title,
        emoji: save.lists.emoji,
        save_count: save.lists.save_count,
        is_saved: true,
        saved_at: save.saved_at,
        notes: save.notes,
        user: { id: save.lists.user_id, username: 'User' }
      }))
    } catch (error) {
      console.error('Failed to fetch saved list cards:', error)
      throw error
    }
  }

  // ===============================================
  // LIST-CENTRIC QUERIES (Analytics, Discovery)
  // ===============================================

  /**
   * Get most popular lists (trending/discovery feed)
   * Target: <10ms response time (uses save_count index)
   */
  async getPopularLists(limit: number = 20): Promise<SavedListCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('lists')
        .select('id, title, emoji, save_count, user_id, created_at')
        .eq('is_public', true)
        .gt('save_count', 0)
        .order('save_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching popular lists:', error)
        throw error
      }

      return (data || []).map(list => ({
        list_id: list.id,
        title: list.title,
        emoji: list.emoji,
        save_count: list.save_count,
        is_saved: false, // Will be updated by caller if user is logged in
        user: { id: list.user_id, username: 'User' }
      }))
    } catch (error) {
      console.error('Failed to fetch popular lists:', error)
      throw error
    }
  }

  /**
   * Get save count for a specific list
   * Target: <5ms response time (uses save_count cache)
   */
  async getListSaveCount(listId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('lists')
        .select('save_count')
        .eq('id', listId)
        .single()

      if (error) {
        console.error('Error getting list save count:', error)
        return 0
      }

      return data.save_count || 0
    } catch (error) {
      console.error('Failed to get list save count:', error)
      return 0
    }
  }

  /**
   * Bulk check if user has saved multiple lists
   * Target: <15ms for 50 lists
   */
  async checkMultipleSavedLists(userId: string, listIds: string[]): Promise<Record<string, boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('saved_lists')
        .select('list_id')
        .eq('user_id', userId)
        .in('list_id', listIds)

      if (error) {
        console.error('Error bulk checking saved lists:', error)
        return {}
      }

      const savedSet = new Set((data || []).map(save => save.list_id))
      return listIds.reduce((acc, listId) => {
        acc[listId] = savedSet.has(listId)
        return acc
      }, {} as Record<string, boolean>)
    } catch (error) {
      console.error('Failed to bulk check saved lists:', error)
      return {}
    }
  }

  // ===============================================
  // ANALYTICS AND INSIGHTS
  // ===============================================

  /**
   * Get user's save statistics
   */
  async getUserSaveStats(userId: string): Promise<{
    total_saved: number
    recent_saves: number
    favorite_categories: string[]
  }> {
    try {
      const { data, error } = await this.supabase
        .from('saved_lists')
        .select(`
          saved_at,
          lists (emoji, view_mode)
        `)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const recentSaves = (data || []).filter(save => save.saved_at >= oneWeekAgo).length

      // Simple emoji-based category analysis
      const emojiCounts: Record<string, number> = {}
      ;(data || []).forEach(save => {
        if (save.lists?.emoji) {
          emojiCounts[save.lists.emoji] = (emojiCounts[save.lists.emoji] || 0) + 1
        }
      })

      const favoriteCategories = Object.entries(emojiCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emoji]) => emoji)

      return {
        total_saved: data?.length || 0,
        recent_saves: recentSaves,
        favorite_categories: favoriteCategories
      }
    } catch (error) {
      console.error('Failed to get user save stats:', error)
      return {
        total_saved: 0,
        recent_saves: 0,
        favorite_categories: []
      }
    }
  }
}

// Export singleton instance
export const savedListsDB = new OptimizedSavedListsDB()