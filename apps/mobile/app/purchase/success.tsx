import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components';
import { useListQuery } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';

export default function PurchaseSuccessScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: list } = useListQuery(listId);

  useEffect(() => {
    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Invalidate list query to refresh with unlocked content
    queryClient.invalidateQueries({ queryKey: ['lists', listId] });
  }, [listId, queryClient]);

  const handleViewList = () => {
    router.replace(`/list/${listId}`);
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>\ud83c\udf89</Text>
        <Text style={styles.title}>Purchase Complete!</Text>
        <Text style={styles.subtitle}>
          You now have full access to{' '}
          <Text style={styles.listTitle}>{list?.title || 'the list'}</Text>
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>\u2713</Text>
            <Text style={styles.featureText}>All links unlocked</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>\u2713</Text>
            <Text style={styles.featureText}>Lifetime access</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>\u2713</Text>
            <Text style={styles.featureText}>Receipt sent to your email</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="View List"
          onPress={handleViewList}
          variant="primary"
          fullWidth
          size="large"
        />
        <Button
          title="Go to Discover"
          onPress={handleGoHome}
          variant="ghost"
          fullWidth
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listTitle: {
    fontWeight: '600',
    color: '#000',
  },
  features: {
    marginTop: 40,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: '600',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 24,
    gap: 8,
  },
  secondaryButton: {
    marginTop: 8,
  },
});
