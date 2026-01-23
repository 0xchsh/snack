import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinkItem, Button, LoadingSpinner, EmptyState } from '@/components';
import { useListQuery, useIsListSavedQuery, useSaveListMutation, useUnsaveListMutation } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { formatListPrice, isListFree, isListPaid } from '@snack/shared/pricing';
import { WEB_URL } from '@/constants/config';

type IconName = keyof typeof Ionicons.glyphMap;

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: list, isLoading, isRefetching, refetch, error } = useListQuery(id);
  const { data: isSaved } = useIsListSavedQuery(list?.id || '');
  const saveListMutation = useSaveListMutation();
  const unsaveListMutation = useUnsaveListMutation();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSave = async () => {
    if (!list?.id || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isSaved) {
        await unsaveListMutation.mutateAsync(list.id);
      } else {
        await saveListMutation.mutateAsync(list.id);
      }
    } catch (error) {
      console.error('Failed to save/unsave list:', error);
    }
  };

  const handleShare = async () => {
    if (!list) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        title: list.title,
        message: `Check out "${list.title}" on Snack!`,
        url: `${WEB_URL}/@${list.user.username}/${list.public_id}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleUserPress = () => {
    if (list?.user.username) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/user/${list.user.username}`);
    }
  };

  const handlePurchase = () => {
    if (!list) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/purchase/checkout',
      params: { listId: list.id },
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !list) {
    return (
      <EmptyState
        emoji="\ud83d\ude22"
        title="List not found"
        description={error?.message || 'This list may have been deleted or made private.'}
        actionTitle="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  const isPaid = isListPaid(list.price_cents);
  const isOwner = user?.id === list.user_id;
  const hasPurchased = false; // TODO: Check purchase status
  const isLocked = isPaid && !isOwner && !hasPurchased;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{list.emoji || '\ud83d\udccc'}</Text>
          <Text style={styles.title}>{list.title}</Text>

          {list.description && (
            <Text style={styles.description}>{list.description}</Text>
          )}

          {/* Creator */}
          <Pressable style={styles.creatorRow} onPress={handleUserPress}>
            {list.user.profile_picture_url ? (
              <Image
                source={{ uri: list.user.profile_picture_url }}
                style={styles.creatorAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.creatorAvatar, styles.creatorAvatarPlaceholder]}>
                <Text style={styles.creatorAvatarText}>
                  {list.user.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorUsername}>@{list.user.username}</Text>
          </Pressable>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{list.links.length}</Text>
              <Text style={styles.statLabel}>links</Text>
            </View>
            {list.save_count != null && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{list.save_count}</Text>
                <Text style={styles.statLabel}>saves</Text>
              </View>
            )}
            {list.view_count != null && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{list.view_count}</Text>
                <Text style={styles.statLabel}>views</Text>
              </View>
            )}
          </View>
        </View>

        {/* Links */}
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>
            Links {isLocked && '\ud83d\udd12'}
          </Text>
          {list.links.length === 0 ? (
            <Text style={styles.noLinks}>No links yet</Text>
          ) : (
            list.links.map((link, index) => (
              <LinkItem
                key={link.id}
                link={link}
                isLocked={isLocked && index > 0}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        {isLocked ? (
          <Button
            title={`Unlock for ${formatListPrice(list.price_cents)}`}
            onPress={handlePurchase}
            variant="primary"
            fullWidth
            size="large"
          />
        ) : (
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleSave}>
              <Ionicons
                name={isSaved ? 'bookmark' as IconName : 'bookmark-outline' as IconName}
                size={24}
                color={isSaved ? '#000' : '#666'}
              />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name={'share-outline' as IconName} size={24} color="#666" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  creatorAvatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  creatorUsername: {
    fontSize: 14,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
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
  linksSection: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  noLinks: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 32,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
