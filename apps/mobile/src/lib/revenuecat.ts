import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_API_KEY } from '@/constants/config';

// Price tiers mapping from Snack cents to RevenueCat product IDs
// Apple price tiers: https://developer.apple.com/help/app-store-connect/reference/price-tier-chart
const PRICE_TIER_MAP: Record<number, string> = {
  99: 'snack_tier_099',     // $0.99
  199: 'snack_tier_199',    // $1.99
  299: 'snack_tier_299',    // $2.99
  399: 'snack_tier_399',    // $3.99
  499: 'snack_tier_499',    // $4.99
  599: 'snack_tier_599',    // $5.99
  699: 'snack_tier_699',    // $6.99
  799: 'snack_tier_799',    // $7.99
  899: 'snack_tier_899',    // $8.99
  999: 'snack_tier_999',    // $9.99
  1499: 'snack_tier_1499',  // $14.99
  1999: 'snack_tier_1999',  // $19.99
  2499: 'snack_tier_2499',  // $24.99
  2999: 'snack_tier_2999',  // $29.99
  4999: 'snack_tier_4999',  // $49.99
  9999: 'snack_tier_9999',  // $99.99
};

// Initialize RevenueCat
export async function initializeRevenueCat(): Promise<void> {
  if (!REVENUECAT_API_KEY) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  try {
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });
    console.log('RevenueCat initialized');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

// Set the user ID for RevenueCat (after auth)
export async function setRevenueCatUserId(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.error('Failed to set RevenueCat user:', error);
  }
}

// Clear RevenueCat user (on sign out)
export async function clearRevenueCatUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('Failed to clear RevenueCat user:', error);
  }
}

// Get the product ID for a given price in cents
export function getProductIdForPrice(priceCents: number): string | null {
  // Find the closest matching price tier
  const tiers = Object.keys(PRICE_TIER_MAP).map(Number).sort((a, b) => a - b);

  // Find exact match or next higher tier
  for (const tier of tiers) {
    if (tier >= priceCents) {
      return PRICE_TIER_MAP[tier] ?? null;
    }
  }

  // If price is higher than all tiers, use the highest
  const highestTier = tiers[tiers.length - 1];
  return highestTier !== undefined ? (PRICE_TIER_MAP[highestTier] ?? null) : null;
}

// Get available packages for a list purchase
export async function getPackageForPrice(priceCents: number): Promise<PurchasesPackage | null> {
  const productId = getProductIdForPrice(priceCents);
  if (!productId) {
    console.error('No product ID found for price:', priceCents);
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering) {
      console.error('No current offering available');
      return null;
    }

    // Find the package with the matching product ID
    const pkg = currentOffering.availablePackages.find(
      (p) => p.product.identifier === productId
    );

    return pkg || null;
  } catch (error) {
    console.error('Failed to get package:', error);
    return null;
  }
}

// Purchase a list
export async function purchaseList(
  priceCents: number,
  listId: string
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  const pkg = await getPackageForPrice(priceCents);

  if (!pkg) {
    return { success: false, error: 'Product not available' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    return { success: true, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }

    console.error('Purchase failed:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

// Check if user has purchased a specific list (via entitlements)
export async function hasListPurchase(listId: string): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    // Check if the user has the list entitlement
    // This depends on how entitlements are set up in RevenueCat
    return customerInfo.entitlements.active[`list_${listId}`] !== undefined;
  } catch (error) {
    console.error('Failed to check purchase:', error);
    return false;
  }
}

// Restore purchases
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return null;
  }
}
