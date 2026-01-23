import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import type { Link } from '@snack/shared/types';

interface LinkItemProps {
  link: Link;
  isLocked?: boolean;
}

export function LinkItem({ link, isLocked = false }: LinkItemProps) {
  const handlePress = async () => {
    if (isLocked) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const canOpen = await Linking.canOpenURL(link.url);
      if (canOpen) {
        await Linking.openURL(link.url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && !isLocked && styles.pressed,
        isLocked && styles.locked,
      ]}
      onPress={handlePress}
      disabled={isLocked}
    >
      {link.favicon_url ? (
        <Image
          source={{ uri: link.favicon_url }}
          style={styles.favicon}
          contentFit="contain"
        />
      ) : (
        <View style={styles.faviconPlaceholder}>
          <Text style={styles.faviconText}>
            {getDomain(link.url).charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={[styles.title, isLocked && styles.lockedText]}
          numberOfLines={2}
        >
          {isLocked ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : (link.title || link.url)}
        </Text>
        <Text
          style={[styles.domain, isLocked && styles.lockedText]}
          numberOfLines={1}
        >
          {isLocked ? '\u2022\u2022\u2022\u2022' : getDomain(link.url)}
        </Text>
      </View>

      {isLocked && (
        <View style={styles.lockIcon}>
          <Text>\ud83d\udd12</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: '#f0f0f0',
  },
  locked: {
    opacity: 0.6,
  },
  favicon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  faviconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faviconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  domain: {
    fontSize: 13,
    color: '#666',
  },
  lockedText: {
    color: '#999',
  },
  lockIcon: {
    marginLeft: 8,
  },
});
