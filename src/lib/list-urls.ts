/**
 * Utility functions for generating list URLs with proper public IDs
 */

export function getListPublicUrl(username: string, publicId: string): string {
  return `/${username}/${publicId}`
}

export function getListEditUrl(username: string, publicId: string): string {
  return `/${username}/${publicId}`
}

export function getListPublicViewUrl(username: string, publicId: string): string {
  return `/${username}/${publicId}?view=public`
}

// For backwards compatibility during migration
export function getListUrlFromObject(list: { public_id?: string; id: string }, username?: string): string {
  const publicId = list.public_id || list.id
  const user = username || 'list'
  return `/${user}/${publicId}`
}