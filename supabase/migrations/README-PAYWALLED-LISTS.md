# Paywalled Lists Feature - Database Schema

## Overview
This migration (`016_add_paywalled_lists.sql`) adds complete support for one-time payment paywalled lists with Stripe integration.

## Business Model
- **Creators** can set a one-time price for their lists (in cents)
- **Buyers** pay once to unlock permanent access to a paywalled list
- **Platform** takes a percentage fee (configured in application code)
- **Creators** can connect Stripe accounts to receive payouts

## Database Changes

### 1. Lists Table Updates
- `currency` (TEXT): Currency code (usd, eur, gbp, etc.) - defaults to 'usd'
- `price_cents` (INTEGER): Existing column - NULL or 0 = free, >0 = paywalled

### 2. Users Table Updates
- `stripe_account_id` (TEXT): Stripe Connect account ID for creators
- `stripe_account_status` (TEXT): Account status (not_connected, pending, active, restricted)
- `stripe_customer_id` (TEXT): Stripe Customer ID for buyers
- `stripe_connected_at` (TIMESTAMP): When creator connected Stripe

### 3. New Table: list_purchases
Tracks all one-time purchases of paywalled lists.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Who made the purchase
- `list_id` (UUID): Which list was purchased
- `amount_paid` (INTEGER): Total amount paid in cents
- `currency` (TEXT): Currency of transaction
- `platform_fee` (INTEGER): Platform's cut in cents
- `creator_earnings` (INTEGER): Creator's earnings in cents
- `stripe_payment_intent_id` (TEXT): Stripe Payment Intent ID
- `stripe_charge_id` (TEXT): Stripe Charge ID
- `stripe_receipt_url` (TEXT): Receipt URL for buyer
- `purchased_at` (TIMESTAMP): Purchase timestamp
- `refunded_at` (TIMESTAMP): Refund timestamp (NULL if not refunded)
- `refund_reason` (TEXT): Reason for refund

**Constraints:**
- Unique constraint on (user_id, list_id) - prevent duplicate purchases
- Foreign keys to users and lists with CASCADE delete

**Indexes:**
- user_id, list_id, stripe_payment_intent_id, purchased_at

### 4. New Table: creator_payouts
Tracks payouts from platform to creators.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Creator receiving payout
- `stripe_account_id` (TEXT): Creator's Stripe account
- `amount` (INTEGER): Payout amount in cents
- `currency` (TEXT): Currency
- `status` (TEXT): pending, processing, paid, failed, cancelled
- `stripe_payout_id` (TEXT): Stripe Payout ID
- `stripe_transfer_id` (TEXT): Stripe Transfer ID
- `requested_at` (TIMESTAMP): When payout was requested
- `processed_at` (TIMESTAMP): When processing started
- `completed_at` (TIMESTAMP): When payout completed
- `failed_reason` (TEXT): Failure reason if applicable
- `admin_notes` (TEXT): Internal notes

**Indexes:**
- user_id, status, requested_at

## Helper Functions

### user_has_purchased_list(user_id, list_id)
Returns BOOLEAN - checks if user has purchased a specific list (non-refunded).

**Usage:**
```sql
SELECT user_has_purchased_list('user-uuid', 'list-uuid');
```

### get_creator_total_earnings(user_id)
Returns total earnings, purchase count, and currency for a creator.

**Returns:**
- `total_earnings` (BIGINT): Total earnings in cents
- `total_purchases` (BIGINT): Number of sales
- `currency` (TEXT): Currency code

**Usage:**
```sql
SELECT * FROM get_creator_total_earnings('user-uuid');
```

### get_creator_available_balance(user_id)
Returns available balance for payout (earnings minus already paid out).

**Returns:**
- `available_balance` (BIGINT): Amount available for payout
- `pending_payouts` (BIGINT): Amount in pending payouts
- `total_earned` (BIGINT): Total earnings to date

**Usage:**
```sql
SELECT * FROM get_creator_available_balance('user-uuid');
```

## Views

### creator_earnings_summary
Analytics view showing earnings per list for creators.

**Columns:**
- `creator_id`: User ID of creator
- `list_id`: List ID
- `list_title`: List title
- `total_purchases`: Number of purchases
- `total_earnings`: Total creator earnings
- `total_platform_fees`: Total platform fees collected
- `currency`: Currency code
- `first_purchase`: Timestamp of first purchase
- `latest_purchase`: Timestamp of latest purchase

**Usage:**
```sql
-- Get earnings for current user's lists
SELECT * FROM creator_earnings_summary
WHERE creator_id = auth.uid();
```

## Row Level Security (RLS)

### list_purchases
- Users can view their own purchases
- Creators can view purchases of their lists

### creator_payouts
- Creators can view only their own payouts

### lists (updated)
Access control now considers purchases:
- Owners can always view their lists
- Free public lists are viewable by everyone
- Paywalled public lists are viewable only by purchasers

### links (updated)
Access control mirrors lists:
- Links are visible if user has access to the parent list

## Triggers

### update_stripe_connected_at
Automatically sets `stripe_connected_at` timestamp when `stripe_account_status` changes to 'active'.

## Migration Steps

To apply this migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Paste contents of 016_add_paywalled_lists.sql
# 3. Run
```

## Application Integration

### 1. Pricing a List
```typescript
// Set list price to $4.99
await supabase
  .from('lists')
  .update({
    price_cents: 499,
    currency: 'usd'
  })
  .eq('id', listId)
```

### 2. Check if User Can Access List
```typescript
// Check purchase status
const { data } = await supabase
  .rpc('user_has_purchased_list', {
    p_user_id: userId,
    p_list_id: listId
  })

// data will be true if purchased, false otherwise
```

### 3. Record a Purchase
```typescript
const { data, error } = await supabase
  .from('list_purchases')
  .insert({
    user_id: buyerId,
    list_id: listId,
    amount_paid: 499,
    currency: 'usd',
    platform_fee: 50, // 10% platform fee
    creator_earnings: 449,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: charge.id,
    stripe_receipt_url: charge.receipt_url
  })
```

### 4. Get Creator Earnings
```typescript
const { data } = await supabase
  .rpc('get_creator_total_earnings', {
    p_user_id: creatorId
  })

// data = { total_earnings, total_purchases, currency }
```

### 5. Request Payout
```typescript
const { data, error } = await supabase
  .from('creator_payouts')
  .insert({
    user_id: creatorId,
    stripe_account_id: stripeAccountId,
    amount: availableBalance,
    currency: 'usd',
    status: 'pending'
  })
```

## Platform Fee Configuration

The platform fee percentage is NOT stored in the database. Configure it in your application code:

```typescript
// lib/pricing.ts
export const PLATFORM_FEE_PERCENTAGE = 0.10 // 10%

export function calculateFees(amountCents: number) {
  const platformFee = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE)
  const creatorEarnings = amountCents - platformFee
  return { platformFee, creatorEarnings }
}
```

## Security Considerations

1. **Prevent Double Purchases**: Unique constraint on (user_id, list_id) prevents duplicate purchases
2. **RLS Enforced**: All tables have RLS enabled - users can only see their own data
3. **Refunds Tracked**: Refunded purchases are marked (refunded_at) but not deleted
4. **Audit Trail**: All timestamps tracked (purchased_at, refunded_at, processed_at, etc.)
5. **Stripe IDs Stored**: Full Stripe audit trail for reconciliation

## Next Steps

After applying this migration:
1. Install Stripe SDK: `npm install stripe @stripe/stripe-js`
2. Configure Stripe API keys in `.env`
3. Set up Stripe Connect for creator onboarding
4. Implement Stripe Checkout for purchases
5. Set up Stripe webhooks for payment confirmation
6. Build creator dashboard for earnings and payouts
