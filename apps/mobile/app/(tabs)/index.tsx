import { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ListCard, LoadingSpinner, EmptyState } from '@/components';
import { useDiscoverQuery } from '@/hooks';
import type { DiscoverListItem } from '@snack/shared/types';

export default function DiscoverScreen() {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscoverQuery();

  const lists = data?.pages.flatMap((page) => page.data) ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: DiscoverListItem }) => {
    return <ListCard list={item} />;
  }, []);

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <LoadingSpinner size="small" />
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (lists.length === 0) {
    return (
      <EmptyState
        emoji="\ud83d\udd0d"
        title="No lists yet"
        description="Be the first to discover amazing curated lists!"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={lists}
        renderItem={renderItem}
        estimatedItemSize={180}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
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
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
