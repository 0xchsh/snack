import { useInfiniteQuery } from '@tanstack/react-query';
import { API_URL } from '@/constants/config';
import type { DiscoverListItem, PaginatedResponse } from '@snack/shared/types';

interface DiscoverResponse extends PaginatedResponse<DiscoverListItem> {}

async function fetchDiscoverLists(page: number): Promise<DiscoverResponse> {
  const response = await fetch(`${API_URL}/api/discover?page=${page}&limit=20`);

  if (!response.ok) {
    throw new Error('Failed to fetch discover lists');
  }

  return response.json();
}

export const discoverKeys = {
  all: ['discover'] as const,
  lists: () => [...discoverKeys.all, 'lists'] as const,
};

export function useDiscoverQuery() {
  return useInfiniteQuery({
    queryKey: discoverKeys.lists(),
    queryFn: ({ pageParam }) => fetchDiscoverLists(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}
