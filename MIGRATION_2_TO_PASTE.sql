-- Migration: Clean up unused columns and improve schema
-- Removes emoji_3d column (using native emojis instead)
-- Adds better comments to clarify pricing (stored in cents for Stripe, displayed as dollars in UI)

-- ============================================================================
-- 1. Remove emoji_3d column (no longer needed with native emojis)
-- ============================================================================

ALTER TABLE lists DROP COLUMN IF EXISTS emoji_3d;

COMMENT ON COLUMN lists.emoji IS 'Native emoji character (e.g., 🎯). Simple text field, no 3D data needed.';

-- ============================================================================
-- 2. Improve price_cents documentation
-- ============================================================================

-- Note: We keep price_cents (not price_dollars) because:
-- 1. Stripe API requires cents (smallest currency unit)
-- 2. Avoids floating-point precision errors (5.00 can become 4.999999)
-- 3. Industry standard for payment systems
-- 4. Easier integer math for fee calculations
--
-- The UI will display this as dollars ($5.00) but store as cents (500) in database

COMMENT ON COLUMN lists.price_cents IS
'Price in cents (e.g., 500 = $5.00). NULL or 0 means free.
Stored in cents to match Stripe API and avoid floating-point errors.
UI displays as dollars for user-friendliness.';

COMMENT ON COLUMN list_purchases.amount_paid IS
'Amount paid in cents (e.g., 500 = $5.00). Matches Stripe Payment Intent amount.';

-- ============================================================================
-- 3. Add helper view for easier querying (with prices in dollars)
-- ============================================================================

CREATE OR REPLACE VIEW lists_with_price_display AS
SELECT
  *,
  CASE
    WHEN price_cents IS NULL OR price_cents = 0 THEN NULL
    ELSE ROUND(price_cents::numeric / 100, 2)
  END as price_dollars
FROM lists;

COMMENT ON VIEW lists_with_price_display IS
'View that includes price_dollars for convenience.
For UI display, use this view or convert price_cents / 100 in application code.';

-- Grant access
GRANT SELECT ON lists_with_price_display TO authenticated;
GRANT SELECT ON lists_with_price_display TO anon;
