import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { DiscoverListItem, ListWithLinks, ListWithUser } from '@snack/shared/types';
import { formatListPrice, isListFree } from '@snack/shared/pricing';

type ListItem = DiscoverListItem | ListWithLinks | ListWithUser;

interface ListCardProps {
  list: ListItem;
  showUser?: boolean;
}

export function ListCard({ list, showUser = true }: ListCardProps) {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/list/${list.public_id}`);
  };

  const handleUserPress = () => {
    if (list.user) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/user/${list.user.username}`);
    }
  };

  const linkCount = 'links' in list ? list.links.length : 0;
  const priceText = isListFree(list.price_cents)
    ? null
    : formatListPrice(list.price_cents);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{list.emoji || '\ud83d\udccc'}</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {list.title}
          </Text>
          {priceText && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{priceText}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {linkCount} {linkCount === 1 ? 'link' : 'links'}
        </Text>
        {list.save_count != null && list.save_count > 0 && (
          <>
            <Text style={styles.metaDot}>\u00b7</Text>
            <Text style={styles.metaText}>
              {list.save_count} {list.save_count === 1 ? 'save' : 'saves'}
            </Text>
          </>
        )}
      </View>

      {showUser && list.user && (
        <Pressable style={styles.userRow} onPress={handleUserPress}>
          {list.user.profile_picture_url ? (
            <Image
              source={{ uri: list.user.profile_picture_url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {list.user.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.username}>@{list.user.username}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    lineHeight: 24,
  },
  priceBadge: {
    backgroundColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
});
