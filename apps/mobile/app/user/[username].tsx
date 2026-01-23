import { useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListCard, LoadingSpinner, EmptyState } from '@/components';
import { usePublicProfileQuery } from '@/hooks';
import type { ListWithLinks } from '@snack/shared/types';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading, isRefetching, refetch, error } = usePublicProfileQuery(username);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: ListWithLinks }) => {
    return <ListCard list={item} showUser={false} />;
  }, []);

  const renderHeader = useCallback(() => {
    if (!profile) return null;

    return (
      <View style={styles.header}>
        {profile.profile_picture_url ? (
          <Image
            source={{ uri: profile.profile_picture_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {profile.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <Text style={styles.username}>@{profile.username}</Text>

        {profile.first_name || profile.last_name ? (
          <Text style={styles.name}>
            {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
          </Text>
        ) : null}

        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.stats.total_lists}</Text>
            <Text style={styles.statLabel}>lists</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.stats.total_saves}</Text>
            <Text style={styles.statLabel}>saves</Text>
          </View>
        </View>

        <Text style={styles.listsTitle}>Lists</Text>
      </View>
    );
  }, [profile]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !profile) {
    return (
      <EmptyState
        emoji="\ud83d\ude22"
        title="User not found"
        description={error?.message || 'This user may not exist.'}
        actionTitle="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <FlashList
        data={profile.lists}
        renderItem={renderItem}
        estimatedItemSize={180}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No public lists yet</Text>
          </View>
        }
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
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#666',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  stats: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  listsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});
