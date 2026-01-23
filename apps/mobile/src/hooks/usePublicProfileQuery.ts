import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/constants/config';
import type { PublicProfile } from '@snack/shared/types';

export const profileKeys = {
  all: ['profiles'] as const,
  public: (username: string) => [...profileKeys.all, 'public', username] as const,
};

export function usePublicProfileQuery(username: string | undefined) {
  return useQuery({
    queryKey: profileKeys.public(username || ''),
    queryFn: async (): Promise<PublicProfile> => {
      const response = await fetch(
        `${API_URL}/api/public-profile/${encodeURIComponent(username || '')}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });
}
