import { ListWithLinks, CreateListForm, User } from '@/types'
import { getRandomEmoji, getDefaultEmoji3D } from '@/lib/emoji'
import { fetchOGDataClient } from './og-client'

const LISTS_STORAGE_KEY = 'snack-mock-lists'

// Mock database service for lists using localStorage
export class MockListDatabase {
  
  // Generate unique ID for new lists
  private generateListId(): string {
    return `list-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }

  // Generate unique ID for new links
  private generateLinkId(): string {
    return `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }

  // Get all lists from localStorage
  private getAllLists(): ListWithLinks[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(LISTS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading lists from localStorage:', error)
      return []
    }
  }

  // Save all lists to localStorage
  private saveAllLists(lists: ListWithLinks[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists))
    } catch (error) {
      console.error('Error saving lists to localStorage:', error)
    }
  }

  // Get lists for a specific user
  getUserLists(userId: string): ListWithLinks[] {
    const allLists = this.getAllLists()
    return allLists.filter(list => list.user_id === userId)
  }

  // Get a specific list by ID
  getListById(listId: string): ListWithLinks | null {
    const allLists = this.getAllLists()
    return allLists.find(list => list.id === listId) || null
  }

  // Create a new empty list for a user
  createEmptyList(user: User): ListWithLinks {
    const defaultEmoji = getDefaultEmoji3D()
    const newList: ListWithLinks = {
      id: this.generateListId(),
      title: 'New list', // Default title - user can edit
      emoji: defaultEmoji.unicode, // Default pretzel emoji
      emoji_3d: defaultEmoji,
      is_public: true,
      price_cents: null,
      view_mode: 'row', // Default view mode
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      links: [], // No links initially
      user: {
        id: user.id,
        username: user.username
      }
    }

    const allLists = this.getAllLists()
    const updatedLists = [...allLists, newList]
    this.saveAllLists(updatedLists)

    console.log('Created new empty list:', newList)
    return newList
  }

  // Create a list from form data
  createList(formData: CreateListForm, user: User): ListWithLinks {
    const newList: ListWithLinks = {
      id: this.generateListId(),
      title: formData.title,
      emoji: formData.emoji || getRandomEmoji(),
      emoji_3d: formData.emoji_3d,
      is_public: formData.is_public,
      price_cents: formData.price_cents || null,
      view_mode: 'row', // Default view mode
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      links: [],
      user: {
        id: user.id,
        username: user.username
      }
    }

    const allLists = this.getAllLists()
    const updatedLists = [...allLists, newList]
    this.saveAllLists(updatedLists)

    console.log('Created new list:', newList)
    return newList
  }

  // Update an existing list
  updateList(listId: string, updates: Partial<ListWithLinks>): ListWithLinks | null {
    const allLists = this.getAllLists()
    const listIndex = allLists.findIndex(list => list.id === listId)
    
    if (listIndex === -1) {
      console.error('List not found for update:', listId)
      return null
    }

    const updatedList = {
      ...allLists[listIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    const updatedLists = [...allLists]
    updatedLists[listIndex] = updatedList
    this.saveAllLists(updatedLists)

    console.log('Updated list:', updatedList)
    return updatedList
  }

  // Delete a list
  deleteList(listId: string, userId: string): boolean {
    const allLists = this.getAllLists()
    const listToDelete = allLists.find(list => list.id === listId)
    
    // Security check: only allow users to delete their own lists
    if (!listToDelete || listToDelete.user_id !== userId) {
      console.error('List not found or unauthorized deletion:', listId)
      return false
    }

    const updatedLists = allLists.filter(list => list.id !== listId)
    this.saveAllLists(updatedLists)

    console.log('Deleted list:', listId)
    return true
  }

  // Add a link to a list
  async addLinkToList(listId: string, linkData: { url: string; title?: string }): Promise<ListWithLinks | null> {
    const list = this.getListById(listId)
    if (!list) return null

    // Shift all existing links down by 1 position
    const updatedLinks = list.links.map(link => ({
      ...link,
      position: link.position + 1
    }))

    // Fetch OG data using OpenGraph.io
    const ogData = await fetchOGDataClient(linkData.url)

    const newLink = {
      id: this.generateLinkId(),
      url: linkData.url,
      title: linkData.title || ogData.title || new URL(linkData.url).hostname,
      favicon_url: ogData.favicon_url || `https://www.google.com/s2/favicons?domain=${new URL(linkData.url).hostname}&sz=32`,
      image_url: ogData.image_url,
      position: 0, // Always add at the top
      list_id: listId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add new link at the beginning of the array
    const updatedList = this.updateList(listId, {
      links: [newLink, ...updatedLinks]
    })

    return updatedList
  }

  // Remove a link from a list
  removeLinkFromList(listId: string, linkId: string): ListWithLinks | null {
    const list = this.getListById(listId)
    if (!list) return null

    const updatedLinks = list.links.filter(link => link.id !== linkId)
    const updatedList = this.updateList(listId, {
      links: updatedLinks
    })

    return updatedList
  }

  // Demo data initialization removed - users create their own content
}

// Export singleton instance
export const mockListDB = new MockListDatabase()