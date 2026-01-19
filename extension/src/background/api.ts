import { API_ENDPOINTS } from '@/shared/constants'
import type {
  SnackList,
  LinkData,
  CreateListRequest,
  ApiResponse,
} from '@/shared/types'
import { getValidAccessToken } from './auth'

// Generic API request with auth
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Get user's lists
export async function fetchLists(): Promise<SnackList[]> {
  const response = await apiRequest<ApiResponse<SnackList[]>>(
    API_ENDPOINTS.lists
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data || []
}

// Create a new list
export async function createList(data: CreateListRequest): Promise<SnackList> {
  const response = await apiRequest<ApiResponse<SnackList>>(
    API_ENDPOINTS.lists,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error('No data returned')
  }

  return response.data
}

// Add links to a list
export async function addLinksToList(
  listId: string,
  links: LinkData[]
): Promise<void> {
  const response = await apiRequest<ApiResponse>(
    API_ENDPOINTS.addLinks(listId),
    {
      method: 'POST',
      body: JSON.stringify({ links }),
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }
}
