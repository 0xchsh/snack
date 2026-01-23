import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, LoadingSpinner } from '@/components';
import { useListQuery } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { purchaseList } from '@/lib/revenuecat';
import { formatListPrice } from '@snack/shared/pricing';

export default function CheckoutScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: list, isLoading } = useListQuery(listId);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!list || !list.price_cents || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPurchasing(true);

    try {
      const result = await purchaseList(list.price_cents, list.id);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
          pathname: '/purchase/success',
          params: { listId: list.id },
        });
      } else if (result.error === 'Purchase cancelled') {
        // User cancelled, just close
        router.back();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Purchase Failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Purchase Failed', error.message || 'Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading || !list) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.content}>
        {/* List Preview */}
        <View style={styles.listPreview}>
          <Text style={styles.emoji}>{list.emoji || '\ud83d\udccc'}</Text>
          <Text style={styles.title}>{list.title}</Text>
          <Text style={styles.linkCount}>
            {list.links.length} {list.links.length === 1 ? 'link' : 'links'}
          </Text>
          <Text style={styles.creator}>by @{list.user.username}</Text>
        </View>

        {/* Price */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>{formatListPrice(list.price_cents)}</Text>
        </View>

        {/* What you get */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What you get</Text>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>\u2713</Text>
            <Text style={styles.benefitText}>Full access to all {list.links.length} links</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>\u2713</Text>
            <Text style={styles.benefitText}>Lifetime access - no subscription</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>\u2713</Text>
            <Text style={styles.benefitText}>Support the creator directly</Text>
          </View>
        </View>
      </View>

      {/* Purchase Button */}
      <View style={styles.footer}>
        <Button
          title={`Purchase for ${formatListPrice(list.price_cents)}`}
          onPress={handlePurchase}
          variant="primary"
          fullWidth
          size="large"
          loading={isPurchasing}
        />
        <Text style={styles.disclaimer}>
          Payment processed by Apple. You can manage subscriptions in Settings.
        </Text>
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
    padding: 24,
  },
  listPreview: {
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
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  linkCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  creator: {
    fontSize: 14,
    color: '#666',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  benefitsSection: {
    paddingTop: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: '600',
  },
  benefitText: {
    fontSize: 15,
    color: '#333',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});
