import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import type { SavedListWithDetails } from '@snack/shared/types';

export const savedListsKeys = {
  all: ['savedLists'] as const,
  list: () => [...savedListsKeys.all, 'list'] as const,
  isSaved: (listId: string) => [...savedListsKeys.all, 'isSaved', listId] as const,
};

export function useSavedListsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: savedListsKeys.list(),
    queryFn: async (): Promise<SavedListWithDetails[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_lists')
        .select(`
          *,
          list:lists (
            *,
            user:users (id, username, profile_picture_url)
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved lists:', error);
        throw error;
      }

      return (data || []) as unknown as SavedListWithDetails[];
    },
    enabled: !!user,
  });
}

export function useIsListSavedQuery(listId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: savedListsKeys.isSaved(listId),
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('saved_lists')
        .select('id')
        .eq('user_id', user.id)
        .eq('list_id', listId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if list is saved:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user && !!listId,
  });
}

export function useSaveListMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_lists')
        .insert({
          user_id: user.id,
          list_id: listId,
        });

      if (error) throw error;
    },
    onMutate: async (listId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: savedListsKeys.isSaved(listId) });

      // Snapshot previous value
      const previousIsSaved = queryClient.getQueryData<boolean>(savedListsKeys.isSaved(listId));

      // Optimistically update
      queryClient.setQueryData(savedListsKeys.isSaved(listId), true);

      return { previousIsSaved };
    },
    onError: (_err, listId, context) => {
      // Rollback on error
      if (context?.previousIsSaved !== undefined) {
        queryClient.setQueryData(savedListsKeys.isSaved(listId), context.previousIsSaved);
      }
    },
    onSettled: () => {
      // Invalidate saved lists
      queryClient.invalidateQueries({ queryKey: savedListsKeys.list() });
    },
  });
}

export function useUnsaveListMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('list_id', listId);

      if (error) throw error;
    },
    onMutate: async (listId) => {
      await queryClient.cancelQueries({ queryKey: savedListsKeys.isSaved(listId) });

      const previousIsSaved = queryClient.getQueryData<boolean>(savedListsKeys.isSaved(listId));

      queryClient.setQueryData(savedListsKeys.isSaved(listId), false);

      return { previousIsSaved };
    },
    onError: (_err, listId, context) => {
      if (context?.previousIsSaved !== undefined) {
        queryClient.setQueryData(savedListsKeys.isSaved(listId), context.previousIsSaved);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedListsKeys.list() });
    },
  });
}
