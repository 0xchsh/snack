import { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ListCard, LoadingSpinner, EmptyState } from '@/components';
import { useSavedListsQuery } from '@/hooks';
import type { SavedListWithDetails } from '@snack/shared/types';

export default function SavedScreen() {
  const router = useRouter();
  const { data: savedLists, isLoading, isRefetching, refetch } = useSavedListsQuery();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExplore = () => {
    router.push('/(tabs)');
  };

  const renderItem = useCallback(({ item }: { item: SavedListWithDetails }) => {
    return <ListCard list={item.list} />;
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!savedLists || savedLists.length === 0) {
    return (
      <EmptyState
        emoji="\ud83d\udd16"
        title="No saved lists"
        description="Lists you save will appear here for easy access."
        actionTitle="Explore Lists"
        onAction={handleExplore}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={savedLists}
        renderItem={renderItem}
        estimatedItemSize={180}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingVertical: 8,
  },
});
