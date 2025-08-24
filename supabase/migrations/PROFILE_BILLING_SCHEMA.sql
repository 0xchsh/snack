-- PROFILE & BILLING SCHEMA ENHANCEMENTS
-- Run this migration to add profile and billing functionality
-- This adds: profile pictures, subscriptions, invoices, and payment methods

-- =================================================================
-- PHASE 1: UPDATE USERS TABLE FOR PROFILE FEATURES
-- =================================================================

-- Add profile picture support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Add indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- =================================================================
-- PHASE 2: CREATE BILLING TABLES
-- =================================================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  tier TEXT NOT NULL, -- pro, premium, etc.
  billing_cycle TEXT NOT NULL, -- monthly, yearly
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- card, bank_account, etc.
  brand TEXT, -- visa, mastercard, etc. (for cards)
  last4 TEXT, -- last 4 digits
  exp_month INTEGER, -- expiration month (for cards)
  exp_year INTEGER, -- expiration year (for cards)
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  number TEXT NOT NULL, -- invoice number from Stripe
  status TEXT NOT NULL, -- paid, open, void, etc.
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  invoice_pdf TEXT, -- URL to PDF from Stripe
  hosted_invoice_url TEXT, -- Stripe hosted invoice URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- PHASE 3: CREATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(user_id, created_at DESC);

-- =================================================================
-- PHASE 4: ENABLE ROW LEVEL SECURITY
-- =================================================================

-- Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- PHASE 5: CREATE RLS POLICIES
-- =================================================================

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage invoices" ON invoices
  FOR ALL USING (auth.role() = 'service_role');

-- =================================================================
-- PHASE 6: CREATE FUNCTIONS
-- =================================================================

-- Function to update subscription status in users table
CREATE OR REPLACE FUNCTION update_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET 
    subscription_status = NEW.status,
    subscription_tier = NEW.tier,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other payment methods for this user to not default
    UPDATE payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- PHASE 7: CREATE TRIGGERS
-- =================================================================

-- Trigger to update user subscription status when subscription changes
CREATE TRIGGER trigger_update_user_subscription_status
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_user_subscription_status();

-- Trigger to ensure single default payment method
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- Update triggers for updated_at columns
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- PHASE 8: CREATE VIEWS
-- =================================================================

-- View for active subscriptions with user info
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.*,
  u.email,
  u.username,
  u.first_name,
  u.last_name
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active';

-- View for user billing summary
CREATE OR REPLACE VIEW user_billing_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.username,
  u.subscription_status,
  u.subscription_tier,
  s.stripe_customer_id,
  s.current_period_end,
  s.cancel_at_period_end,
  COUNT(i.id) as total_invoices,
  SUM(CASE WHEN i.status = 'paid' THEN i.amount_paid ELSE 0 END) as total_paid
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN invoices i ON u.id = i.user_id
GROUP BY u.id, u.email, u.username, u.subscription_status, u.subscription_tier, 
         s.stripe_customer_id, s.current_period_end, s.cancel_at_period_end;

-- =================================================================
-- VERIFICATION
-- =================================================================

-- Verify new columns were added to users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('profile_picture_url', 'subscription_status', 'subscription_tier')
ORDER BY column_name;

-- Verify all billing tables exist with correct structure
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('subscriptions', 'payment_methods', 'invoices')
GROUP BY table_name
ORDER BY table_name;

-- Success message
SELECT 
  '🎉 Profile & Billing schema created successfully!' as result,
  'Added: profile pictures, subscriptions, payment methods, invoices' as features_added,
  'Views: active_subscriptions, user_billing_summary' as views_created;