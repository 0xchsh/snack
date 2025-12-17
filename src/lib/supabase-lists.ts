import { ListWithLinks, CreateListForm, User } from '@/types'
import { createClient } from '@/lib/supabase'
import { getRandomEmoji } from '@/lib/emoji'
import { fetchOGDataClient } from './og-client'

// Supabase database service for lists
export class SupabaseListDatabase {
  private supabase = createClient()
  
  constructor() {
    // Verify Supabase client is initialized
    if (!this.supabase) {
      throw new Error('Supabase client failed to initialize. Check your environment variables.')
    }
    console.log('SupabaseListDatabase initialized')
  }

  // Get lists for a specific user
  async getUserLists(userId: string): Promise<ListWithLinks[]> {
    try {
      console.log('Fetching lists for user:', userId)
      
      const { data: lists, error } = await this.supabase
        .from('lists')
        .select('id, public_id, title, emoji, is_public, price_cents, currency, view_mode, user_id, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      console.log('Raw query result:', { lists, error, userId })

      if (error) {
        console.error('Error fetching user lists:', error)
        throw error
      }

      console.log('Successfully fetched lists:', lists?.length || 0)
      
      // Debug: Check the order of lists by created_at
      if (lists && lists.length > 0) {
        console.log('Lists order check:', lists.map(l => ({ 
          id: l.id.substring(0, 8), 
          title: l.title, 
          created_at: l.created_at 
        })))
      }

      // Get user data for the lists
      const { data: userData } = await this.supabase
        .from('users')
        .select('id, username')
        .eq('id', userId)
        .single()

      // Get links for each list and transform the data
      const listsWithLinks = await Promise.all(
        (lists || []).map(async (list) => {
          let links: any[] = []
          
          try {
            const { data: listLinks, error: linksError } = await this.supabase
              .from('links')
              .select('id, list_id, title, url, description, image_url, position, created_at, updated_at')
              .eq('list_id', list.id)
              .order('position', { ascending: true })

            if (linksError) {
              console.warn('Error fetching links for list', list.id, ':', linksError.message)
            } else {
              links = listLinks || []
            }
          } catch (linkError) {
            console.warn('Failed to fetch links for list', list.id)
          }

          return {
            ...list,
            links,
            user: {
              id: list.user_id,
              username: userData?.username || 'User'
            }
          }
        })
      )

      // Ensure newest lists are first (double-check sorting)
      const sortedLists = listsWithLinks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      console.log('Final sorted order:', sortedLists.map(l => ({ 
        id: l.id.substring(0, 8), 
        title: l.title, 
        created_at: l.created_at 
      })))

      return sortedLists
    } catch (error) {
      console.error('Failed to get user lists:', error)
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
          links (*)
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

      // Get user data separately 
      const { data: userData } = await this.supabase
        .from('users')
        .select('id, username')
        .eq('id', list.user_id)
        .single()

      // Transform the data to match our ListWithLinks type
      return {
        ...list,
        links: list.links || [],
        user: {
          id: list.user_id,
          username: userData?.username || 'Anonymous'
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
      console.log('Creating empty list for user:', user.id)

      // Check if we have a valid Supabase session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        throw new Error('Failed to verify authentication')
      }

      if (!session) {
        console.error('No active Supabase session')
        throw new Error('You must be signed in to create lists')
      }

      console.log('Session found for user:', session.user.id, 'email:', session.user.email)

      const newListData = {
        id: crypto.randomUUID(), // Generate a UUID for the list
        // public_id is auto-generated by database trigger (8-char short ID)
        title: 'New list', // Default title - user can edit
        emoji: getRandomEmoji(), // Random emoji for each new list
        is_public: true,
        price_cents: null, // Now that column exists
        view_mode: 'card', // Default view mode
        user_id: session.user.id, // Use the session user ID to ensure it matches auth
      }

      console.log('Inserting list with data:', newListData)

      const { data: list, error } = await this.supabase
        .from('lists')
        .insert(newListData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating list:', JSON.stringify(error, null, 2))
        console.error('Error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw new Error(error.message || 'Failed to create list in Supabase')
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
      console.log('Creating list for user:', user.id)
      
      // Check if we have a valid Supabase session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        throw new Error('Failed to verify authentication')
      }
      
      if (!session) {
        console.error('No active Supabase session')
        throw new Error('You must be signed in to create lists')
      }
      
      console.log('Session found for user:', session.user.id, 'email:', session.user.email)
      
      const newListData = {
        id: crypto.randomUUID(), // Generate a UUID for the list
        // public_id is auto-generated by database trigger (8-char short ID)
        title: formData.title,
        emoji: formData.emoji || getRandomEmoji(),
        // emoji_3d: formData.emoji_3d ? JSON.stringify(formData.emoji_3d) : null, // Temporarily removed
        is_public: formData.is_public,
        // price_cents: formData.price_cents || null, // Temporarily removed
        view_mode: 'card', // Default view mode
        user_id: session.user.id, // Use the session user ID to ensure it matches auth
      }

      const { data: list, error } = await this.supabase
        .from('lists')
        .insert(newListData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating list:', JSON.stringify(error, null, 2))
        console.error('Error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw new Error(error.message || 'Failed to create list in Supabase')
      }

      console.log('Created new list:', list)

      return {
        ...list,
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
      // Check if we have a valid Supabase session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        throw new Error('Failed to verify authentication')
      }
      
      if (!session) {
        console.error('No active Supabase session')
        throw new Error('You must be signed in to update lists')
      }

      console.log('Attempting to update list:', { listId, sessionUserId: session.user.id })

      // First check if the list exists and user has permission to update it
      const { data: existingList, error: fetchError } = await this.supabase
        .from('lists')
        .select('id, user_id, title')
        .eq('id', listId)
        .maybeSingle() // Use maybeSingle instead of single to handle 0 results gracefully

      if (fetchError) {
        console.error('Error checking if list exists:', JSON.stringify(fetchError, null, 2))
        throw new Error(`Database error while checking list: ${fetchError.message}`)
      }

      if (!existingList) {
        console.error('List not found:', listId)
        throw new Error('List not found. It may have been deleted or you may not have permission to access it.')
      }

      console.log('Found existing list:', { 
        id: existingList.id, 
        user_id: existingList.user_id, 
        title: existingList.title 
      })

      if (existingList.user_id !== session.user.id) {
        console.error('Permission denied:', { 
          listOwner: existingList.user_id, 
          currentUser: session.user.id 
        })
        throw new Error('You can only update your own lists')
      }

      // Prepare the update data, excluding read-only fields
      const updateData: any = {}

      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.emoji !== undefined) updateData.emoji = updates.emoji
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public
      if (updates.price_cents !== undefined) updateData.price_cents = updates.price_cents

      console.log('Updating list with data:', { listId, updateData })

      const { data: list, error } = await this.supabase
        .from('lists')
        .update(updateData)
        .eq('id', listId)
        .select(`
          *,
          links (*)
        `)
        .single()

      if (error) {
        console.error('Supabase error updating list:', JSON.stringify(error, null, 2))
        console.error('Error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw new Error(error.message || 'Failed to update list in Supabase')
      }

      // Get user data separately 
      const { data: userData } = await this.supabase
        .from('users')
        .select('id, username')
        .eq('id', list.user_id)
        .single()

      console.log('Updated list:', list)

      return {
        ...list,
        links: list.links || [],
        user: {
          id: list.user_id,
          username: userData?.username || 'Anonymous'
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
        title: ogData.title || linkData.title || new URL(linkData.url).hostname,
        favicon_url: ogData.favicon_url || `https://www.google.com/s2/favicons?domain=${new URL(linkData.url).hostname}&sz=32`,
        image_url: ogData.image_url,
        description: ogData.description,
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
}

// Export singleton instance
export const supabaseListDB = new SupabaseListDatabase()