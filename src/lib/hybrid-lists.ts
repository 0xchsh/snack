import { ListWithLinks, CreateListForm, User } from '@/types'
import { supabaseListDB } from '@/lib/supabase-lists'
import { mockListDB } from '@/lib/mock-lists'

// Hybrid database service that tries Supabase first, falls back to localStorage
export class HybridListDatabase {
  private useSupabase = true

  // Test Supabase connectivity
  async testSupabaseConnection(): Promise<boolean> {
    try {
      console.log('Testing Supabase connection...')
      
      // Try a simple query to test connectivity
      const result = await supabaseListDB.getUserLists('test-connection-check')
      console.log('Supabase connection test successful')
      return true
    } catch (error) {
      console.warn('Supabase connection test failed:', error)
      this.useSupabase = false
      return false
    }
  }

  // Get lists for a specific user
  async getUserLists(userId: string): Promise<ListWithLinks[]> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.getUserLists(userId)
      } catch (error) {
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.getUserLists(userId)
      }
    } else {
      return mockListDB.getUserLists(userId)
    }
  }

  // Get a specific list by ID
  async getListById(listId: string): Promise<ListWithLinks | null> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.getListById(listId)
      } catch (error) {
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.getListById(listId)
      }
    } else {
      return mockListDB.getListById(listId)
    }
  }

  // Create a new empty list for a user
  async createEmptyList(user: User): Promise<ListWithLinks> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.createEmptyList(user)
      } catch (error: any) {
        // Check if it's a database error specifically
        if (error?.message === 'SUPABASE_DB_ERROR' || 
            error?.message === 'SUPABASE_RLS_ERROR' || 
            error?.code === '42501' || 
            error?.code === '42P01' ||
            error?.code === 'PGRST204') {
          console.warn('Supabase database issue, falling back to localStorage')
          this.useSupabase = false
          return mockListDB.createEmptyList(user)
        }
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.createEmptyList(user)
      }
    } else {
      return mockListDB.createEmptyList(user)
    }
  }

  // Create a list from form data
  async createList(formData: CreateListForm, user: User): Promise<ListWithLinks> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.createList(formData, user)
      } catch (error: any) {
        // Check if it's a database error specifically
        if (error?.message === 'SUPABASE_DB_ERROR' || 
            error?.message === 'SUPABASE_RLS_ERROR' || 
            error?.code === '42501' || 
            error?.code === '42P01' ||
            error?.code === 'PGRST204') {
          console.warn('Supabase database issue, falling back to localStorage')
          this.useSupabase = false
          return mockListDB.createList(formData, user)
        }
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.createList(formData, user)
      }
    } else {
      return mockListDB.createList(formData, user)
    }
  }

  // Update an existing list
  async updateList(listId: string, updates: Partial<ListWithLinks>): Promise<ListWithLinks | null> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.updateList(listId, updates)
      } catch (error) {
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.updateList(listId, updates)
      }
    } else {
      return mockListDB.updateList(listId, updates)
    }
  }

  // Delete a list
  async deleteList(listId: string, userId: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.deleteList(listId, userId)
      } catch (error) {
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.deleteList(listId, userId)
      }
    } else {
      return mockListDB.deleteList(listId, userId)
    }
  }

  // Add a link to a list
  async addLinkToList(listId: string, linkData: { url: string; title?: string }): Promise<ListWithLinks | null> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.addLinkToList(listId, linkData)
      } catch (error) {
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.addLinkToList(listId, linkData)
      }
    } else {
      return mockListDB.addLinkToList(listId, linkData)
    }
  }

  // Remove a link from a list
  async removeLinkFromList(listId: string, linkId: string): Promise<ListWithLinks | null> {
    if (this.useSupabase) {
      try {
        return await supabaseListDB.removeLinkFromList(listId, linkId)
      } catch (error) {
        console.warn('Supabase failed, falling back to localStorage:', error)
        this.useSupabase = false
        return mockListDB.removeLinkFromList(listId, linkId)
      }
    } else {
      return mockListDB.removeLinkFromList(listId, linkId)
    }
  }

  // Demo data initialization removed - users create their own content

  // Get current storage method being used
  getCurrentStorageMethod(): 'supabase' | 'localstorage' {
    return this.useSupabase ? 'supabase' : 'localstorage'
  }

  // Force switch to localStorage mode (for testing)
  forceLocalStorageMode(): void {
    console.log('Forcing localStorage mode')
    this.useSupabase = false
  }

  // Try to reconnect to Supabase
  async retrySupabaseConnection(): Promise<boolean> {
    console.log('Attempting to reconnect to Supabase...')
    const connected = await this.testSupabaseConnection()
    if (connected) {
      console.log('Successfully reconnected to Supabase')
      this.useSupabase = true
    }
    return connected
  }
}

// Export singleton instance
export const hybridListDB = new HybridListDatabase()