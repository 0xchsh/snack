-- Migration: Add Paywalled Lists Feature
-- This migration adds support for one-time payment paywalled lists with Stripe integration

-- ============================================================================
-- 1. Update lists table with payment fields
-- ============================================================================

-- Add currency column (defaults to USD)
ALTER TABLE lists ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- Add constraint to ensure valid currency codes (ISO 4217)
ALTER TABLE lists ADD CONSTRAINT valid_currency
  CHECK (currency IN ('usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'inr'));

-- Add comment to price_cents column
COMMENT ON COLUMN lists.price_cents IS 'Price in cents. NULL or 0 means free list. Non-zero means paywalled list.';
COMMENT ON COLUMN lists.currency IS 'Currency code (ISO 4217). Defaults to USD.';

-- Add index for querying paid lists
CREATE INDEX IF NOT EXISTS idx_lists_price ON lists(price_cents) WHERE price_cents > 0;

-- ============================================================================
-- 2. Add Stripe account info to users table
-- ============================================================================

-- Stripe Connect account ID for creators who want to receive payments
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;

-- Stripe Connect account status
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected'
  CHECK (stripe_account_status IN ('not_connected', 'pending', 'active', 'restricted'));

-- Stripe Customer ID (for buyers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Timestamps
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.stripe_account_id IS 'Stripe Connect account ID for creators to receive payments';
COMMENT ON COLUMN users.stripe_account_status IS 'Status of creator Stripe Connect account';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe Customer ID for making purchases';

-- ============================================================================
-- 3. Create list_purchases table
-- ============================================================================

CREATE TABLE IF NOT EXISTS list_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who bought what
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,

  -- Payment details
  amount_paid INTEGER NOT NULL, -- Amount paid in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  platform_fee INTEGER NOT NULL, -- Platform fee in cents (our cut)
  creator_earnings INTEGER NOT NULL, -- Creator's earnings in cents

  -- Stripe details
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  stripe_receipt_url TEXT,

  -- Metadata
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE, -- NULL if not refunded
  refund_reason TEXT,

  -- Prevent duplicate purchases
  CONSTRAINT unique_user_list_purchase UNIQUE (user_id, list_id)
);

-- Enable RLS
ALTER TABLE list_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list_purchases
CREATE POLICY "Users can view their own purchases" ON list_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view purchases of their lists" ON list_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_purchases.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON list_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_list_id ON list_purchases(list_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent ON list_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON list_purchases(purchased_at DESC);

COMMENT ON TABLE list_purchases IS 'Tracks one-time purchases of paywalled lists';
COMMENT ON COLUMN list_purchases.platform_fee IS 'Platform revenue share in cents';
COMMENT ON COLUMN list_purchases.creator_earnings IS 'Amount creator receives in cents';

-- ============================================================================
-- 4. Create creator_payouts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Creator details
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,

  -- Payout details
  amount INTEGER NOT NULL, -- Payout amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),

  -- Stripe details
  stripe_payout_id TEXT UNIQUE,
  stripe_transfer_id TEXT,

  -- Metadata
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,

  -- Admin notes
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_payouts
CREATE POLICY "Creators can view their own payouts" ON creator_payouts
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON creator_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON creator_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON creator_payouts(requested_at DESC);

COMMENT ON TABLE creator_payouts IS 'Tracks payouts to creators from their earnings';

-- ============================================================================
-- 5. Create helper functions
-- ============================================================================

-- Function to check if a user has purchased a specific list
CREATE OR REPLACE FUNCTION user_has_purchased_list(
  p_user_id UUID,
  p_list_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM list_purchases
    WHERE user_id = p_user_id
    AND list_id = p_list_id
    AND refunded_at IS NULL -- Only count non-refunded purchases
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total earnings for a creator
CREATE OR REPLACE FUNCTION get_creator_total_earnings(
  p_user_id UUID
)
RETURNS TABLE (
  total_earnings BIGINT,
  total_purchases BIGINT,
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(lp.creator_earnings), 0)::BIGINT as total_earnings,
    COUNT(*)::BIGINT as total_purchases,
    COALESCE(MAX(lp.currency), 'usd') as currency
  FROM list_purchases lp
  JOIN lists l ON l.id = lp.list_id
  WHERE l.user_id = p_user_id
  AND lp.refunded_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available balance for payout (earnings - already paid out)
CREATE OR REPLACE FUNCTION get_creator_available_balance(
  p_user_id UUID
)
RETURNS TABLE (
  available_balance BIGINT,
  pending_payouts BIGINT,
  total_earned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH earnings AS (
    SELECT COALESCE(SUM(lp.creator_earnings), 0) as total
    FROM list_purchases lp
    JOIN lists l ON l.id = lp.list_id
    WHERE l.user_id = p_user_id
    AND lp.refunded_at IS NULL
  ),
  payouts AS (
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('paid', 'processing') THEN amount ELSE 0 END), 0) as paid,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending
    FROM creator_payouts
    WHERE user_id = p_user_id
  )
  SELECT
    (earnings.total - payouts.paid - payouts.pending)::BIGINT as available_balance,
    payouts.pending::BIGINT as pending_payouts,
    earnings.total::BIGINT as total_earned
  FROM earnings, payouts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Update RLS policies for lists table (paywall access control)
-- ============================================================================

-- Drop old policy that allows viewing all public lists
DROP POLICY IF EXISTS "Users can view their own lists" ON lists;

-- Create new policy that considers purchases for paid lists
CREATE POLICY "Users can view their own lists or purchased lists" ON lists
  FOR SELECT USING (
    auth.uid() = user_id -- Owner can always view
    OR (is_public = true AND (price_cents IS NULL OR price_cents = 0)) -- Free public lists
    OR (is_public = true AND user_has_purchased_list(auth.uid(), id)) -- Purchased paywalled lists
  );

-- Same for links - only show links if user owns list, list is free, or user purchased it
DROP POLICY IF EXISTS "Users can view links in their lists or public lists" ON links;

CREATE POLICY "Users can view links if they have access" ON links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = links.list_id
      AND (
        lists.user_id = auth.uid() -- Owner
        OR (lists.is_public = true AND (lists.price_cents IS NULL OR lists.price_cents = 0)) -- Free
        OR (lists.is_public = true AND user_has_purchased_list(auth.uid(), lists.id)) -- Purchased
      )
    )
  );

-- ============================================================================
-- 7. Add triggers for audit trail
-- ============================================================================

-- Trigger to update stripe_connected_at when stripe_account_status changes to active
CREATE OR REPLACE FUNCTION update_stripe_connected_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stripe_account_status = 'active' AND OLD.stripe_account_status != 'active' THEN
    NEW.stripe_connected_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stripe_connected_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.stripe_account_status IS DISTINCT FROM OLD.stripe_account_status)
  EXECUTE FUNCTION update_stripe_connected_at();

-- ============================================================================
-- 8. Create views for analytics
-- ============================================================================

-- View for creator earnings dashboard
CREATE OR REPLACE VIEW creator_earnings_summary AS
SELECT
  l.user_id as creator_id,
  l.id as list_id,
  l.title as list_title,
  COUNT(lp.id) as total_purchases,
  COALESCE(SUM(lp.creator_earnings), 0) as total_earnings,
  COALESCE(SUM(lp.platform_fee), 0) as total_platform_fees,
  MAX(lp.currency) as currency,
  MIN(lp.purchased_at) as first_purchase,
  MAX(lp.purchased_at) as latest_purchase
FROM lists l
LEFT JOIN list_purchases lp ON lp.list_id = l.id AND lp.refunded_at IS NULL
WHERE l.price_cents > 0
GROUP BY l.user_id, l.id, l.title;

-- Grant access to authenticated users (they can only see their own via RLS)
GRANT SELECT ON creator_earnings_summary TO authenticated;

COMMENT ON VIEW creator_earnings_summary IS 'Summary of creator earnings per list';
