import { ListWithLinks, CreateListForm, User } from '@/types'
import { createClient } from '@/lib/supabase'
import { getRandomEmoji, getDefaultEmoji3D } from '@/lib/emoji'
import { fetchOGDataClient } from './og-client'

// Supabase database service for lists
export class SupabaseListDatabase {
  private supabase = createClient()

  // Get lists for a specific user
  async getUserLists(userId: string): Promise<ListWithLinks[]> {
    try {
      console.log('Fetching lists for user:', userId)
      
      const { data: lists, error } = await this.supabase
        .from('lists')
        .select(`
          *,
          links (*),
          users!lists_user_id_fkey (id, username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        // Check if it's a table not found error or permission issue first
        if (error.code === 'PGRST204' || 
            error.code === '42P01' || 
            error.message?.includes('relation') || 
            error.message?.includes('does not exist') ||
            error.message?.includes('permission denied') ||
            error.message?.includes('JWT')) {
          console.info('Supabase database not available, falling back to localStorage')
          return []
        }
        
        // Only log as error if it's an unexpected error
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        throw error
      }

      console.log('Successfully fetched lists:', lists?.length || 0)

      // Transform the data to match our ListWithLinks type
      return (lists || []).map(list => ({
        ...list,
        links: list.links || [],
        user: {
          id: list.users.id,
          username: list.users.username || 'Anonymous'
        }
      }))
    } catch (error) {
      console.error('Failed to get user lists:', error)
      
      // If it's a database connectivity issue, return empty array instead of throwing
      if (error instanceof TypeError && error.message?.includes('fetch')) {
        console.warn('Network error connecting to Supabase. Using fallback.')
        return []
      }
      
      throw error
    }
  }

  // Get a specific list by ID
  async getListById(listId: string): Promise<ListWithLinks | null> {
    try {
      const { data: list, error } = await this.supabase
        .from('lists')
        .select(`
          *,
          links (*),
          users!lists_user_id_fkey (id, username)
        `)
        .eq('id', listId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        console.error('Error fetching list:', error)
        throw error
      }

      // Transform the data to match our ListWithLinks type
      return {
        ...list,
        links: list.links || [],
        user: {
          id: list.users.id,
          username: list.users.username || 'Anonymous'
        }
      }
    } catch (error) {
      console.error('Failed to get list by ID:', error)
      throw error
    }
  }

  // Create a new empty list for a user
  async createEmptyList(user: User): Promise<ListWithLinks> {
    try {
      // First, ensure user exists in the users table
      await this.ensureUserExists(user)

      const defaultEmoji = getDefaultEmoji3D()
      const newListData = {
        title: 'New list', // Default title - user can edit
        emoji: defaultEmoji.unicode, // Default pretzel emoji
        emoji_3d: JSON.stringify(defaultEmoji),
        is_public: false,
        price_cents: null,
        user_id: user.id,
      }

      const { data: list, error } = await this.supabase
        .from('lists')
        .insert(newListData)
        .select(`
          *,
          links (*),
          users!lists_user_id_fkey (id, username)
        `)
        .single()

      if (error) {
        console.error('Error creating empty list:', error)
        throw error
      }

      console.log('Created new empty list:', list)
      
      return {
        ...list,
        links: [],
        user: {
          id: user.id,
          username: user.username
        }
      }
    } catch (error) {
      console.error('Failed to create empty list:', error)
      throw error
    }
  }

  // Create a list from form data
  async createList(formData: CreateListForm, user: User): Promise<ListWithLinks> {
    try {
      // First, ensure user exists in the users table
      await this.ensureUserExists(user)

      const newListData = {
        title: formData.title,
        emoji: formData.emoji || getRandomEmoji(),
        emoji_3d: formData.emoji_3d ? JSON.stringify(formData.emoji_3d) : null,
        is_public: formData.is_public,
        price_cents: formData.price_cents || null,
        user_id: user.id,
      }

      const { data: list, error } = await this.supabase
        .from('lists')
        .insert(newListData)
        .select(`
          *,
          links (*),
          users!lists_user_id_fkey (id, username)
        `)
        .single()

      if (error) {
        console.error('Error creating list:', error)
        throw error
      }

      console.log('Created new list:', list)
      
      return {
        ...list,
        emoji_3d: list.emoji_3d ? JSON.parse(list.emoji_3d) : undefined,
        links: [],
        user: {
          id: user.id,
          username: user.username
        }
      }
    } catch (error) {
      console.error('Failed to create list:', error)
      throw error
    }
  }

  // Update an existing list
  async updateList(listId: string, updates: Partial<ListWithLinks>): Promise<ListWithLinks | null> {
    try {
      // Prepare the update data, excluding read-only fields
      const updateData: any = {}
      
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji
      if (updates.emoji_3d !== undefined) updateData.emoji_3d = updates.emoji_3d ? JSON.stringify(updates.emoji_3d) : null
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public
      if (updates.price_cents !== undefined) updateData.price_cents = updates.price_cents

      const { data: list, error } = await this.supabase
        .from('lists')
        .update(updateData)
        .eq('id', listId)
        .select(`
          *,
          links (*),
          users!lists_user_id_fkey (id, username)
        `)
        .single()

      if (error) {
        console.error('Error updating list:', error)
        throw error
      }

      console.log('Updated list:', list)
      
      return {
        ...list,
        emoji_3d: list.emoji_3d ? JSON.parse(list.emoji_3d) : undefined,
        links: list.links || [],
        user: {
          id: list.users.id,
          username: list.users.username || 'Anonymous'
        }
      }
    } catch (error) {
      console.error('Failed to update list:', error)
      throw error
    }
  }

  // Delete a list
  async deleteList(listId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', userId) // Security: only allow users to delete their own lists

      if (error) {
        console.error('Error deleting list:', error)
        throw error
      }

      console.log('Deleted list:', listId)
      return true
    } catch (error) {
      console.error('Failed to delete list:', error)
      throw error
    }
  }

  // Add a link to a list
  async addLinkToList(listId: string, linkData: { url: string; title?: string }): Promise<ListWithLinks | null> {
    try {
      // Get current list
      const currentList = await this.getListById(listId)
      if (!currentList) return null

      // Shift all existing links down by 1 position to make room at the top
      if (currentList.links.length > 0) {
        const { error: updateError } = await this.supabase
          .rpc('increment_link_positions', { 
            target_list_id: listId 
          })

        if (updateError) {
          console.error('Error updating link positions:', updateError)
          // Fallback: manually update each link position
          for (const link of currentList.links) {
            await this.supabase
              .from('links')
              .update({ position: link.position + 1 })
              .eq('id', link.id)
          }
        }
      }

      // Fetch OG data using OpenGraph.io
      const ogData = await fetchOGDataClient(linkData.url)

      const newLinkData = {
        url: linkData.url,
        title: linkData.title || ogData.title || new URL(linkData.url).hostname,
        favicon_url: ogData.favicon_url || `https://www.google.com/s2/favicons?domain=${new URL(linkData.url).hostname}&sz=32`,
        image_url: ogData.image_url,
        position: 0, // Always add at the top
        list_id: listId,
      }

      const { error } = await this.supabase
        .from('links')
        .insert(newLinkData)

      if (error) {
        console.error('Error adding link:', error)
        throw error
      }

      // Return updated list
      return await this.getListById(listId)
    } catch (error) {
      console.error('Failed to add link to list:', error)
      throw error
    }
  }

  // Remove a link from a list
  async removeLinkFromList(listId: string, linkId: string): Promise<ListWithLinks | null> {
    try {
      const { error } = await this.supabase
        .from('links')
        .delete()
        .eq('id', linkId)
        .eq('list_id', listId)

      if (error) {
        console.error('Error removing link:', error)
        throw error
      }

      // Return updated list
      return await this.getListById(listId)
    } catch (error) {
      console.error('Failed to remove link from list:', error)
      throw error
    }
  }

  // Ensure user exists in the users table (for mock auth compatibility)
  private async ensureUserExists(user: User): Promise<void> {
    try {
      const { data: existingUser, error: fetchError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: insertError } = await this.supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            username: user.username,
          })

        if (insertError) {
          // Check if it's a table/permission issue
          if (insertError.code === '42P01' || 
              insertError.message?.includes('relation') || 
              insertError.message?.includes('does not exist') ||
              insertError.message?.includes('permission denied')) {
            console.info('Supabase user creation not available, using localStorage fallback')
            return
          }
          console.error('Error creating user:', insertError)
          throw insertError
        }

        console.log('Created user:', user.id)
      } else if (fetchError) {
        // Check if it's a table/permission issue
        if (fetchError.code === '42P01' || 
            fetchError.message?.includes('relation') || 
            fetchError.message?.includes('does not exist') ||
            fetchError.message?.includes('permission denied')) {
          console.info('Supabase user check not available, using localStorage fallback')
          return
        }
        console.error('Error checking user existence:', fetchError)
        throw fetchError
      }
      // User exists, continue
    } catch (error) {
      // Check if it's a database availability error
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as any
        if (supabaseError.code === '42P01' || 
            supabaseError.message?.includes('relation') || 
            supabaseError.message?.includes('does not exist') ||
            supabaseError.message?.includes('permission denied')) {
          console.info('Supabase user management not available, using localStorage fallback')
          return
        }
      }
      console.error('Failed to ensure user exists:', error)
      throw error
    }
  }

  // Initialize with some demo data if user has no lists
  async initializeDemoData(user: User): Promise<void> {
    try {
      const existingLists = await this.getUserLists(user.id)
      
      // Only add demo data if user has no lists
      if (existingLists.length === 0) {
        const demoList = await this.createList({
          title: 'Welcome to Snack! 👋',
          emoji: '🍿',
          is_public: false,
        }, user)

        // Add some demo links
        await this.addLinkToList(demoList.id, {
          url: 'https://github.com',
          title: 'GitHub - Where software is built'
        })
        
        await this.addLinkToList(demoList.id, {
          url: 'https://vercel.com',
          title: 'Vercel - Develop. Preview. Ship.'
        })

        console.log('Initialized demo data for user:', user.id)
      }
    } catch (error) {
      console.error('Failed to initialize demo data:', error)
      // Don't throw here - demo data is not critical
    }
  }
}

// Export singleton instance
export const supabaseListDB = new SupabaseListDatabase()