import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/constants/config';
import type { ListWithLinks } from '@snack/shared/types';

export const listKeys = {
  all: ['lists'] as const,
  detail: (id: string) => [...listKeys.all, id] as const,
  public: (username: string, listId: string) => [...listKeys.all, 'public', username, listId] as const,
};

export function useListQuery(listId: string | undefined) {
  return useQuery({
    queryKey: listKeys.detail(listId || ''),
    queryFn: async (): Promise<ListWithLinks> => {
      const response = await fetch(`${API_URL}/api/lists/${listId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('List not found');
        }
        if (response.status === 403) {
          throw new Error('This list is private');
        }
        throw new Error('Failed to fetch list');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePublicListQuery(username: string | undefined, listId: string | undefined) {
  return useQuery({
    queryKey: listKeys.public(username || '', listId || ''),
    queryFn: async (): Promise<ListWithLinks> => {
      const response = await fetch(
        `${API_URL}/api/users/${encodeURIComponent(username || '')}/lists/${encodeURIComponent(listId || '')}`
      );

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }

      // Fall back to generic list endpoint
      if (response.status === 404) {
        const fallbackResponse = await fetch(`${API_URL}/api/lists/${listId}`);
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          return fallbackResult.data;
        }
      }

      if (response.status === 403) {
        throw new Error('This list is private');
      }

      throw new Error('List not found');
    },
    enabled: !!username && !!listId,
    staleTime: 1000 * 60 * 5,
  });
}
