# Paid Lists Feature - Product Requirements Document

## Executive Summary

This document outlines the implementation plan for a paid lists feature that allows creators to monetize their curated link collections. The platform will take a 10% commission while creators receive 90% of sales revenue (minus payment processing fees).

**Selected Approach:** Stripe Connect with Express Accounts
**Implementation Timeline:** 6 weeks
**Transaction Fees:** 2.9% + $0.30 per transaction
**Revenue Split:** 10% platform, 90% creator

---

## Table of Contents

1. [Current Tech Stack](#current-tech-stack)
2. [Payment Processing Analysis](#payment-processing-analysis)
3. [Recommended Solution](#recommended-solution)
4. [Database Schema](#database-schema)
5. [User Experience Flows](#user-experience-flows)
6. [Security & Compliance](#security--compliance)
7. [Cost Analysis](#cost-analysis)
8. [Implementation Roadmap](#implementation-roadmap)
9. [File Structure](#file-structure)
10. [Success Metrics](#success-metrics)

---

## Current Tech Stack

### Database
- **PostgreSQL** via Supabase
- Existing tables: `users`, `lists`, `links`, `saved_lists`, `subscriptions`, `payment_methods`, `invoices`
- Auth: Supabase Auth with Row Level Security (RLS)
- Note: `lists` table already has `price_cents` field in schema

### Framework
- **Next.js 15** with React 19
- Server-side rendering with API routes
- Existing API structure in `/src/app/api/`

### Current Features
- User authentication and profiles
- List creation and management
- Public/private lists
- Short IDs for list URLs (e.g., `username/abc123XY`)
- Analytics tracking (views, clicks)

---

## Payment Processing Analysis

### Option 1: Stripe Connect P RECOMMENDED

**Pricing:**
- Standard account: 2.9% + $0.30 per transaction
- Platform fee: Additional 0.25-0.5% (negotiable at scale)
- **For $5 list:** ~$0.45 in fees (9%)
- **Your 10% cut:** $0.50
- **Creator gets:** $4.05 (81%)

**Pros:**
 Built-in revenue splitting (automatic platform commission)
 No need for money transmitter license (Stripe handles it)
 Embedded onboarding for creators
 Automatic 1099 tax form generation (US)
 Global payouts to 40+ countries
 Instant payout option (for extra fee)
 Handles refunds/chargebacks automatically
 PCI compliance handled by Stripe
 Webhook infrastructure for payment events
 Best documentation and developer experience

**Cons:**
L Higher fees than alternatives (but lowest overall)
L Requires creator bank account verification
L More complex initial setup

**Implementation Complexity:** Medium (2-3 weeks core functionality)

---

### Option 2: Lemon Squeezy

**Pricing:**
- 5% + $0.50 per transaction
- **For $5 list:** $0.75 in fees (15%)
- **Your 10% cut:** $0.50
- **Creator gets:** $3.75 (75%)

**Pros:**
 Merchant of Record (handles all tax/VAT globally)
 Simpler compliance (they handle everything)
 Great for digital products
 Affiliate program built-in

**Cons:**
L Higher fees eat into creator earnings (66% more expensive)
L Less flexible for custom flows
L Revenue share setup is manual (not as elegant)
L Limited payout schedule options

---

### Option 3: Stripe Payment Links (Simple Alternative)

**Pricing:**
- 2.9% + $0.30 per transaction (same as Connect)

**Pros:**
 Simplest Stripe implementation
 No code for payment page
 Fast to implement (3-5 days)

**Cons:**
L No automatic revenue splitting
L Manual payout management needed
L No built-in creator dashboard
L Manual tax handling

---

### Option 4: Paddle

**Pricing:**
- 5% + $0.50 per transaction (same as Lemon Squeezy)

**Pros:**
 Merchant of Record
 Handles global tax compliance
 Established platform

**Cons:**
L High fees
L Not optimized for marketplace/revenue splits
L Would need manual payout system

---

### Option 5: PayPal L NOT RECOMMENDED

**Pricing:**
- 3.49% + $0.49 per transaction
- **For $5 list:** $0.66 in fees (13%)

**Cons:**
L Poor developer experience
L No native revenue splitting
L Frequent account holds/disputes
L Manual payout system needed

---

## Recommended Solution: Stripe Connect

### Why Stripe Connect?

1. **Most cost-efficient long-term** - Lowest transaction fees
2. **Best developer experience** - Excellent docs, SDKs, support
3. **Scalable** - Used by Shopify, DoorDash, Substack
4. **Automatic compliance** - No money transmitter license needed
5. **Built-in revenue splitting** - No manual calculations
6. **Creator-friendly** - Fast payouts, good UX

### Account Type: Express Accounts

Three types of Stripe Connect accounts:
1. **Standard** - Full Stripe experience (creators see Stripe branding)
2. **Express** P - Embedded onboarding, limited branding (RECOMMENDED)
3. **Custom** - Full white-label (complex, requires more compliance)

**Why Express:**
- Balance between ease and control
- Faster onboarding (minutes vs. hours)
- Stripe handles most compliance
- Good creator experience
- Reduced liability

---

## Database Schema

### New Tables

```sql
-- Creator Stripe accounts
CREATE TABLE creator_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  stripe_account_status TEXT NOT NULL, -- 'pending', 'active', 'restricted'
  payouts_enabled BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  balance_available_cents INTEGER DEFAULT 0,
  balance_pending_cents INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- List purchases (access grants)
CREATE TABLE list_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount_paid_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  creator_earnings_cents INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'succeeded', 'refunded', 'disputed'
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,

  UNIQUE(buyer_user_id, list_id) -- One purchase per user per list
);

-- Payouts to creators
CREATE TABLE creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_account_id UUID NOT NULL REFERENCES creator_accounts(id),
  stripe_payout_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'paid', 'failed', 'canceled'
  arrival_date TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics for sales tracking
CREATE TABLE list_sales_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  total_refunds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(list_id, date)
);
```

### Indexes

```sql
CREATE INDEX idx_creator_accounts_user_id ON creator_accounts(user_id);
CREATE INDEX idx_creator_accounts_stripe_id ON creator_accounts(stripe_account_id);
CREATE INDEX idx_list_purchases_list_id ON list_purchases(list_id);
CREATE INDEX idx_list_purchases_buyer_id ON list_purchases(buyer_user_id);
CREATE INDEX idx_list_purchases_status ON list_purchases(status);
CREATE INDEX idx_creator_payouts_account_id ON creator_payouts(creator_account_id);
CREATE INDEX idx_sales_analytics_list_date ON list_sales_analytics(list_id, date);
```

### Row Level Security (RLS) Policies

```sql
ALTER TABLE creator_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_sales_analytics ENABLE ROW LEVEL SECURITY;

-- Creators can view their own account
CREATE POLICY "Users can view own creator account" ON creator_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Buyers can view their own purchases
CREATE POLICY "Users can view own purchases" ON list_purchases
  FOR SELECT USING (auth.uid() = buyer_user_id);

-- Creators can view purchases of their lists
CREATE POLICY "Creators can view purchases of their lists" ON list_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_purchases.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Creators can view their own payouts
CREATE POLICY "Creators can view own payouts" ON creator_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creator_accounts
      WHERE creator_accounts.id = creator_payouts.creator_account_id
      AND creator_accounts.user_id = auth.uid()
    )
  );

-- Creators can view analytics for their lists
CREATE POLICY "Creators can view own list analytics" ON list_sales_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_sales_analytics.list_id
      AND lists.user_id = auth.uid()
    )
  );
```

### Updates to Existing Tables

```sql
-- Add to lists table
ALTER TABLE lists ADD COLUMN stripe_product_id TEXT;
ALTER TABLE lists ADD COLUMN stripe_price_id TEXT;
ALTER TABLE lists ADD COLUMN is_paid BOOLEAN DEFAULT false;
```

---

## User Experience Flows

### Flow 1: Creator Sets Price on List

**Steps:**
1. Creator navigates to list editor
2. Toggles "Make this list paid" switch
3. If no Stripe account connected:
   - Shows "Connect with Stripe" button
   - Redirects to Stripe Express onboarding
   - Creator completes bank account verification (2-3 minutes)
   - Returns to list editor after completion
4. Creator enters price (e.g., $5)
   - Minimum price validation ($1.00)
   - Shows estimated earnings after fees
5. System creates Stripe Product + Price
6. List updates with `is_paid = true`, `price_cents = 500`
7. Success message: "Your list is now available for $5"

**UI Components:**
- Toggle switch for paid/free
- Price input with currency formatting
- Earnings calculator showing breakdown
- Stripe Connect button (if not connected)
- Account status indicator

---

### Flow 2: Buyer Purchases Access to List

**Steps:**
1. Buyer visits paid list URL (e.g., `username/abc123XY`)
2. Sees paywall with:
   - List title, emoji, description
   - Price prominently displayed
   - "Unlock for $5" button
   - Sample/preview (optional: show first 2 links)
3. Clicks "Unlock for $5"
4. Redirects to Stripe Checkout:
   - Pre-filled email if logged in
   - Card payment form
   - Shows platform name as merchant
5. Buyer completes payment
6. Stripe processes payment:
   - 90% transferred to creator's connected account
   - 10% platform fee to your account
7. Webhook confirms payment ’ Creates `list_purchases` record
8. Redirects back to list page
9. Buyer now sees full list content
10. Confirmation email sent to buyer

**UI Components:**
- Paywall overlay/modal
- Price display with clear CTA
- Stripe Checkout (hosted by Stripe)
- Success message after purchase
- "You own this list" indicator

---

### Flow 3: Creator Views Earnings & Analytics

**Steps:**
1. Creator navigates to "Earnings" dashboard
2. Sees overview:
   - **Available Balance:** $127.35 (ready for payout)
   - **Pending Balance:** $45.20 (processing, available in 2 days)
   - **Total Sales:** 47 purchases
   - **Total Revenue:** $172.55
3. Views analytics charts:
   - Revenue over time (line chart)
   - Sales by list (bar chart)
   - Conversion rate (%)
4. Sees recent transactions table:
   - Date, buyer (anonymous), list, amount, status
5. **Automatic Payouts:** Enabled by default
   - Daily schedule: funds transferred to bank automatically
   - Shows next payout date and estimated amount
6. Views payout history:
   - Date, amount, status, arrival date

**UI Components:**
- Balance cards (available/pending)
- Revenue charts (recharts or similar)
- Transactions table with pagination
- Payout history table
- Export to CSV button

---

### Flow 4: Refund Request (30-day window)

**Steps:**
1. Buyer requests refund (within 30 days of purchase)
   - Clicks "Request Refund" on purchased list
   - Provides reason (dropdown + optional text)
2. Creator receives notification
3. Creator reviews refund request in dashboard
   - Sees buyer reason
   - Options: Approve or Deny
4. If approved:
   - Stripe processes refund
   - Platform fee returned proportionally
   - Access revoked for buyer
   - Webhook updates `list_purchases` status to 'refunded'
5. Email notifications sent to both parties

**Automatic Refund Policy:**
- Within 24 hours: Automatic approval
- After 24 hours: Creator review required
- After 30 days: No refunds allowed

---

### Flow 5: Access Verification (Server-side)

**Implementation:**
```typescript
async function userHasAccessToList(userId: string, listId: string) {
  const list = await getList(listId);

  // Free lists or list owner always has access
  if (!list.is_paid || list.user_id === userId) {
    return true;
  }

  // Check if user purchased
  const purchase = await db.list_purchases.findFirst({
    where: {
      buyer_user_id: userId,
      list_id: listId,
      status: 'succeeded'
    }
  });

  return !!purchase;
}
```

**Applied on:**
- List view page (server component)
- API endpoints that return list data
- Link click tracking (verify access before recording click)

---

## Security & Compliance

### PCI Compliance

 **PCI-DSS SAQ A Compliant** (easiest level)
- Using Stripe Checkout/Elements ’ No card data touches your servers
- Stripe is PCI Level 1 certified
- No need for annual audits or security scans

### Webhook Security

**Verify webhooks are from Stripe:**
```typescript
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Best practices:**
- Use webhook secrets (generated by Stripe)
- Verify signature on every webhook
- Use HTTPS only
- Implement idempotency (handle duplicate webhooks)
- Log all webhook events for debugging

### Money Transmitter License

 **NOT NEEDED** - Stripe Connect handles this
- Stripe holds the required licenses globally
- You're a technology platform, not a payment processor
- Stripe assumes liability for payment processing

### Tax Compliance

**United States:**
- Stripe generates **1099-K** forms automatically for creators earning >$600/year
- Creators responsible for reporting income on tax returns
- Platform reports total payments to IRS

**International:**
- Stripe handles currency conversion
- Can enable **Stripe Tax** for automatic VAT/GST calculation
- Creators responsible for local tax compliance

**Recommendations:**
- Add tax ID collection for creators earning >$600 (US)
- Display tax notice during creator onboarding
- Provide tax FAQ/documentation

### Fraud Prevention

**Built-in Stripe Radar:**
- Machine learning fraud detection (included free)
- Blocks suspicious transactions automatically
- Risk scores for each payment

**Additional Security:**
- **3D Secure (SCA):** Required for EU payments, optional for US
- **Rate limiting:** Prevent abuse of API endpoints
- **Email verification:** Require verified email for purchases
- **CAPTCHAs:** Add to checkout if fraud detected

**Chargebacks:**
- Stripe handles disputes automatically
- Provides evidence collection interface
- Automatic access revocation on chargeback
- Platform can set chargeback liability (creator vs. platform)

---

## Cost Analysis

### Transaction Breakdown (for $5 list)

**Stripe Connect:**
```
Sale price:              $5.00
Stripe fee (2.9% + 30¢): -$0.45  (9%)
Platform fee (10%):      -$0.50  (10%)
Creator earnings:        $4.05   (81%)
```

**Comparison with Lemon Squeezy:**
```
Sale price:              $5.00
Lemon fee (5% + 50¢):    -$0.75  (15%)
Platform fee (10%):      -$0.50  (10%)
Creator earnings:        $3.75   (75%)

Difference: Creators lose $0.30 per sale with Lemon Squeezy
```

### Monthly Revenue Projections

**At 100 sales/month ($5 avg):**
- Gross Revenue: $500
- Stripe Fees: $45
- Platform Earnings: $50
- Creator Earnings: $405
- **Net Platform Revenue:** $5

**At 1,000 sales/month ($5 avg):**
- Gross Revenue: $5,000
- Stripe Fees: $450
- Platform Earnings: $500
- Creator Earnings: $4,050
- **Net Platform Revenue:** $50

**At 10,000 sales/month ($5 avg):**
- Gross Revenue: $50,000
- Stripe Fees: $4,500
- Platform Earnings: $5,000
- Creator Earnings: $40,500
- **Net Platform Revenue:** $500

**At 100,000 sales/month ($5 avg):**
- Gross Revenue: $500,000
- Stripe Fees: $45,000
- Platform Earnings: $50,000
- Creator Earnings: $405,000
- **Net Platform Revenue:** $5,000

### Break-Even Analysis

**Development Cost Estimate:**
- 6 weeks development @ $150/hr: $36,000 (assuming 40 hrs/week)
- Stripe account setup: $0
- Infrastructure (additional server costs): ~$50/month

**Break-even:**
- Need ~7,200 transactions at $5 each to break even on development
- Or 720/month for 10 months
- Or 72/month for 100 months

**Alternative (lower price points):**
- At $10/list: Platform earns $1/sale ’ 3,600 transactions to break even
- At $20/list: Platform earns $2/sale ’ 1,800 transactions to break even

---

## Implementation Roadmap

### Phase 1: Database & Infrastructure (Week 1)

**Tasks:**
- [ ] Create database migration files
  - `creator_accounts` table
  - `list_purchases` table
  - `creator_payouts` table
  - `list_sales_analytics` table
  - Update `lists` table with pricing fields
- [ ] Add indexes for performance
- [ ] Set up Row Level Security policies
- [ ] Run migrations on development database
- [ ] Install Stripe SDK: `npm install stripe @stripe/stripe-js`
- [ ] Set up environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_CONNECT_WEBHOOK_SECRET`
- [ ] Create Stripe Connect account (if not already done)
- [ ] Set up webhook endpoint in Stripe dashboard

**Deliverables:**
- Database schema ready
- Stripe configured
- Environment ready for development

---

### Phase 2: Creator Onboarding (Week 2)

**Backend Tasks:**
- [ ] Create API route: `/api/stripe/connect/onboard`
  - Generate Stripe Express account
  - Create account link for onboarding
  - Store account ID in database
- [ ] Create API route: `/api/stripe/connect/account-status`
  - Fetch account status from Stripe
  - Update local database with status
- [ ] Create API route: `/api/stripe/connect/dashboard-link`
  - Generate login link to Stripe Express dashboard
- [ ] Implement webhook handler for `account.updated`
  - Update `creator_accounts` table when status changes

**Frontend Tasks:**
- [ ] Create component: `StripeConnectButton`
  - Handles onboarding flow
  - Shows loading states
  - Error handling
- [ ] Create component: `CreatorAccountStatus`
  - Shows connection status
  - Displays verification requirements
  - Link to Stripe dashboard
- [ ] Add "Connect Stripe" section to user settings
- [ ] Create earnings dashboard page: `/dashboard?tab=earnings`
  - Balance display (available/pending)
  - Recent transactions table
  - Payout history

**Testing:**
- [ ] Test complete onboarding flow
- [ ] Test returning user flow
- [ ] Test account status updates
- [ ] Test error scenarios (rejected account, etc.)

**Deliverables:**
- Creators can connect Stripe accounts
- Account status displayed correctly
- Basic earnings dashboard functional

---

### Phase 3: Payment & Access Control (Week 3)

**Backend Tasks:**
- [ ] Create API route: `/api/lists/set-price`
  - Create Stripe Product for list
  - Create Stripe Price
  - Update list with pricing info
- [ ] Create API route: `/api/stripe/checkout/create-session`
  - Create checkout session with destination charge
  - Set platform fee (10%)
  - Include metadata (list_id, buyer_id)
- [ ] Create API route: `/api/stripe/checkout/success`
  - Verify payment completed
  - Grant access to list
- [ ] Implement access control middleware
  - Server-side verification function
  - Apply to list view routes
  - Apply to API endpoints

**Frontend Tasks:**
- [ ] Add pricing section to list editor
  - Toggle "Make this list paid"
  - Price input field (with validation)
  - Earnings calculator preview
  - Save button
- [ ] Create component: `Paywall`
  - Shows when user visits paid list without access
  - Displays price and list preview
  - "Unlock" button ’ Stripe Checkout
- [ ] Create component: `ListAccessBadge`
  - Shows "You own this" or "Free" or price
- [ ] Update public list view
  - Check access on server
  - Render full list if has access
  - Render paywall if no access
- [ ] Create success page: `/list/[id]/purchased`
  - Shows confirmation message
  - Link to view list

**Webhook Tasks:**
- [ ] Implement `checkout.session.completed` handler
  - Create `list_purchases` record
  - Grant access to buyer
  - Update analytics
  - Send confirmation email

**Testing:**
- [ ] Test setting price on list
- [ ] Test Stripe Product/Price creation
- [ ] Test complete purchase flow
- [ ] Test access verification (with/without purchase)
- [ ] Test edge cases (already purchased, creator viewing own list)

**Deliverables:**
- Creators can set prices on lists
- Buyers can purchase access
- Access control working correctly
- Purchase confirmation flow complete

---

### Phase 4: Webhooks & Automation (Week 4)

**Webhook Handlers:**
- [ ] `checkout.session.completed` (already done in Phase 3)
- [ ] `account.updated`
  - Update creator account status
  - Enable/disable payouts based on Stripe status
- [ ] `payout.created`
  - Record payout in database
  - Send notification to creator
- [ ] `payout.paid`
  - Update payout status to 'paid'
  - Update creator balance
- [ ] `payout.failed`
  - Update payout status to 'failed'
  - Alert creator with failure reason
- [ ] `charge.refunded`
  - Update purchase status to 'refunded'
  - Revoke buyer access
  - Update analytics
  - Send notification to buyer

**Automation:**
- [ ] Set up automatic payouts
  - Configure Stripe payout schedule (daily recommended)
  - Or implement manual payout request flow
- [ ] Implement retry logic for failed webhooks
  - Exponential backoff
  - Maximum 3 retries
- [ ] Add idempotency to webhook handlers
  - Prevent duplicate processing
  - Use Stripe event IDs

**Monitoring:**
- [ ] Add logging for all webhook events
- [ ] Set up error alerts for failed webhooks
- [ ] Create admin dashboard to view webhook logs

**Testing:**
- [ ] Use Stripe CLI to test webhooks locally
- [ ] Test each webhook scenario
- [ ] Test webhook signature verification
- [ ] Test idempotency (send duplicate webhooks)
- [ ] Test failure scenarios

**Deliverables:**
- All webhook handlers implemented
- Automatic payouts configured
- Retry logic working
- Monitoring in place

---

### Phase 5: Refunds & Analytics (Week 5)

**Refund System:**

**Backend:**
- [ ] Create API route: `/api/refunds/request`
  - Buyer submits refund request
  - Store request in database
- [ ] Create API route: `/api/refunds/process`
  - Creator approves/denies refund
  - If approved: Process refund via Stripe
- [ ] Implement automatic refund logic
  - Within 24 hours: Auto-approve
  - After 30 days: Reject
- [ ] Add refund reason tracking
- [ ] Update `list_purchases` with refund info

**Frontend:**
- [ ] Add "Request Refund" button on purchased lists
  - Only shows within 30-day window
  - Modal with reason dropdown
- [ ] Create refund management page for creators
  - View pending refund requests
  - Approve/deny buttons
  - View refund history
- [ ] Add refund status to purchase history

**Analytics Dashboard:**

**Backend:**
- [ ] Create API route: `/api/analytics/revenue`
  - Aggregate revenue by day/week/month
  - Calculate conversion rates
  - Top performing lists
- [ ] Create API route: `/api/analytics/sales`
  - Sales count over time
  - Average transaction value
- [ ] Implement analytics data aggregation
  - Daily cron job to update `list_sales_analytics`
  - Or real-time aggregation

**Frontend:**
- [ ] Create analytics dashboard page
  - Revenue chart (line chart with date range picker)
  - Sales chart (bar chart)
  - Conversion rate metric
  - Top lists table
- [ ] Add filters:
  - Date range (last 7 days, 30 days, all time)
  - Specific list
- [ ] Implement CSV export
  - Export transactions
  - Export revenue summary

**Testing:**
- [ ] Test refund request flow
- [ ] Test refund approval/denial
- [ ] Test automatic refunds
- [ ] Test access revocation on refund
- [ ] Test analytics calculations
- [ ] Test chart rendering with sample data
- [ ] Test CSV export

**Deliverables:**
- Refund system fully functional
- Analytics dashboard showing revenue/sales data
- CSV export working
- All edge cases handled

---

### Phase 6: Testing, Polish & Launch (Week 6)

**End-to-End Testing:**
- [ ] Complete user journey tests:
  - Creator onboarding
  - Setting price on list
  - Buyer purchasing access
  - Viewing earnings
  - Requesting payout
  - Requesting refund
- [ ] Test error scenarios:
  - Payment failure
  - Stripe account rejected
  - Payout failure
  - Webhook failures
- [ ] Test edge cases:
  - Multiple purchases (should fail)
  - Purchasing own list
  - Accessing list after refund
  - Changing price on already-paid list

**Security Audit:**
- [ ] Review all API endpoints for authentication
- [ ] Verify RLS policies are working correctly
- [ ] Test access control exhaustively
- [ ] Review webhook signature verification
- [ ] Check for SQL injection vulnerabilities
- [ ] Test rate limiting on checkout endpoint
- [ ] Review environment variable security

**Performance Testing:**
- [ ] Load test checkout flow (simulate 100 concurrent purchases)
- [ ] Optimize database queries with indexes
- [ ] Add caching where appropriate
- [ ] Test webhook processing under load

**Email Notifications:**
- [ ] Purchase confirmation email (buyer)
  - Include list title, price paid, access link
- [ ] Sale notification email (creator)
  - Include buyer info (or anonymous), amount earned
- [ ] Payout confirmation email (creator)
  - Include amount, arrival date, bank account
- [ ] Refund confirmation email (both parties)
  - Include reason, refund amount

**UI Polish:**
- [ ] Add loading states to all async operations
- [ ] Add success/error toasts
- [ ] Improve error messages (user-friendly)
- [ ] Add empty states (no purchases yet, etc.)
- [ ] Mobile responsive design check
- [ ] Accessibility audit (keyboard navigation, screen readers)

**Documentation:**
- [ ] Creator guide: "How to monetize your lists"
  - Connecting Stripe
  - Setting prices
  - Viewing earnings
  - Managing refunds
- [ ] FAQ page
  - Fees breakdown
  - Payout schedule
  - Refund policy
  - Tax information
- [ ] Terms of Service updates
  - Creator commission structure
  - Refund policy
  - Tax responsibilities

**Soft Launch:**
- [ ] Enable feature flag for paid lists
- [ ] Invite 10-20 beta creators
- [ ] Monitor for bugs/issues
- [ ] Collect feedback
- [ ] Iterate based on feedback

**Launch:**
- [ ] Enable feature for all users
- [ ] Announcement email/blog post
- [ ] Social media announcement
- [ ] Monitor metrics:
  - Creator adoption rate
  - Purchase conversion rate
  - Average list price
  - Refund rate
  - Revenue

**Deliverables:**
- Feature fully tested and polished
- Documentation complete
- Email notifications working
- Soft launch successful
- Public launch ready

---

## File Structure

```
src/
   app/
      api/
         stripe/
            connect/
               onboard/route.ts          # Create Stripe Express account
               account-status/route.ts   # Fetch account status
               dashboard-link/route.ts   # Generate Stripe dashboard link
            checkout/
               create-session/route.ts   # Create checkout session
               success/route.ts          # Handle successful checkout
            webhooks/route.ts             # Handle all Stripe webhooks
            payouts/
                request/route.ts          # Creator requests payout
                history/route.ts          # Fetch payout history
         lists/
            set-price/route.ts            # Update list pricing
         refunds/
            request/route.ts              # Buyer requests refund
            process/route.ts              # Creator processes refund
         analytics/
             revenue/route.ts              # Revenue analytics
             sales/route.ts                # Sales analytics
      (app)/
         dashboard/
             earnings/page.tsx             # Earnings dashboard page
      list/
          [id]/
              purchased/page.tsx            # Purchase success page
   components/
      stripe-connect-button.tsx            # Stripe onboarding button
      creator-account-status.tsx           # Display account status
      paywall.tsx                           # Paywall for paid lists
      list-pricing-settings.tsx            # Price settings in list editor
      earnings-dashboard.tsx               # Creator earnings overview
      revenue-chart.tsx                    # Revenue line chart
      sales-chart.tsx                      # Sales bar chart
      transactions-table.tsx               # Transaction history table
      payout-history.tsx                   # Payout history component
      refund-request-modal.tsx             # Refund request form
      list-access-badge.tsx                # Shows ownership/price status
   lib/
      stripe-server.ts                     # Server-side Stripe client
      stripe-client.ts                     # Client-side Stripe (loadStripe)
      access-control.ts                    # Access verification functions
      webhooks/
         handlers.ts                      # Webhook handler functions
         verify.ts                        # Webhook signature verification
      analytics/
          aggregator.ts                    # Analytics aggregation logic
   types/
      stripe.ts                            # Stripe-related types
      payments.ts                          # Payment/purchase types
   hooks/
       useStripeConnect.ts                  # Hook for Stripe Connect status
       useEarnings.ts                       # Hook for fetching earnings
       useListAccess.ts                     # Hook for checking list access

supabase/
   migrations/
       013_add_paid_lists.sql               # Database migration
```

---

## Success Metrics

### Key Performance Indicators (KPIs)

**Creator Adoption:**
- Target: 20% of active creators connect Stripe within 3 months
- Target: 10% of all lists become paid within 6 months

**Revenue:**
- Target: $1,000 MRR (Monthly Recurring Revenue) within 6 months
- Target: $10,000 MRR within 12 months

**Transaction Metrics:**
- Average list price: $5-$15 (track to optimize fee structure)
- Purchase conversion rate: 5-10% (visitors to paid lists who purchase)
- Refund rate: <5% (industry standard is 3-5%)

**Creator Satisfaction:**
- Average earnings per creator: >$50/month (for creators with paid lists)
- Payout success rate: >99%
- Onboarding completion rate: >80%

**Platform Health:**
- Webhook processing success rate: >99.9%
- Payment processing time: <2 seconds
- Access grant latency: <5 seconds after payment

### Analytics to Track

**Dashboard Metrics:**
1. Total platform revenue (all time + monthly)
2. Total creator earnings (all time + monthly)
3. Number of paid lists
4. Number of purchases
5. Average transaction value
6. Top earning creators
7. Top earning lists
8. Refund rate by creator
9. Chargeback rate
10. Failed payment rate

**Creator Metrics (per creator):**
1. Total revenue
2. Total sales count
3. Average list price
4. Conversion rate
5. Refund rate
6. Available balance
7. Pending balance
8. Total payouts received

**List Metrics (per list):**
1. Price
2. Total purchases
3. Total revenue
4. Conversion rate (views ’ purchases)
5. Refund count
6. Average time to purchase (from first view)

---

## Risk Mitigation

### Potential Risks & Solutions

**1. High Refund Rate**
- **Risk:** Buyers request refunds en masse, hurting creator earnings
- **Mitigation:**
  - 30-day refund window (industry standard)
  - Require refund reason
  - Track refund rate per creator (flag accounts with >20%)
  - Consider preview mode to reduce buyer's remorse

**2. Fraud/Stolen Cards**
- **Risk:** Fraudulent purchases lead to chargebacks
- **Mitigation:**
  - Stripe Radar (built-in fraud detection)
  - 3D Secure authentication for high-risk transactions
  - Monitor chargeback rate (flag if >1%)
  - IP tracking and rate limiting

**3. Creator Account Issues**
- **Risk:** Creators have Stripe accounts rejected/restricted
- **Mitigation:**
  - Clear onboarding instructions
  - Support documentation for common issues
  - Fallback: hold funds until account verified

**4. Webhook Failures**
- **Risk:** Webhooks fail, access not granted
- **Mitigation:**
  - Implement retry logic (exponential backoff)
  - Idempotency to prevent duplicate processing
  - Manual reconciliation tool for failed webhooks
  - Alert system for webhook failures

**5. Tax Compliance**
- **Risk:** Creators don't report income, platform liable
- **Mitigation:**
  - Stripe auto-generates 1099-K forms
  - Display tax notice during onboarding
  - Collect tax ID for US creators earning >$600
  - Clear terms that creators responsible for taxes

**6. Low Adoption**
- **Risk:** Creators don't want to use paid lists
- **Mitigation:**
  - Clear value proposition in marketing
  - Showcase success stories
  - Educational content on monetization
  - Consider lower platform fee initially (5% instead of 10%)

---

## Future Enhancements (Post-Launch)

### Phase 2 Features (3-6 months after launch)

1. **Subscriptions**
   - Monthly/yearly access to all creator's lists
   - Recurring revenue for creators
   - Uses Stripe Subscriptions

2. **Bundles**
   - Creators can bundle multiple lists
   - Discounted price for bundle
   - Single purchase grants access to all

3. **Tiered Pricing**
   - Different price levels with different benefits
   - E.g., Basic ($5), Premium ($10 with extras)

4. **Name Your Price**
   - Buyers can pay what they want above minimum
   - Good for donations/support model

5. **Discount Codes**
   - Creators generate promo codes
   - Percentage or fixed amount discounts
   - Track code usage and effectiveness

6. **Affiliate Program**
   - Users can refer buyers and earn commission
   - Track referrals via unique links
   - Automated commission payouts

7. **Preview Mode**
   - Show first 3-5 links for free
   - Rest behind paywall
   - Reduces refund rate

8. **Gift Purchases**
   - Buy access for someone else
   - Send via email
   - Good for corporate/educational use

9. **Analytics Improvements**
   - Conversion funnel visualization
   - A/B testing for pricing
   - Cohort analysis
   - Revenue forecasting

10. **Creator Tiers**
    - Reduce platform fee for high-volume creators
    - E.g., >100 sales/month: 5% fee instead of 10%
    - Incentivize power users

---

## Appendix

### Stripe Connect Account Types Comparison

| Feature | Standard | Express | Custom |
|---------|----------|---------|--------|
| Onboarding | Full Stripe | Embedded | Full custom |
| Branding | Stripe | Mixed | Your brand |
| Dashboard | Stripe | Stripe | Build your own |
| Support | Stripe | Stripe | You handle |
| Liability | Lower | Medium | Higher |
| Complexity | Low | Medium | High |
| Time to implement | 1 week | 2 weeks | 4-6 weeks |

**Recommendation:** Use **Express** for balance of control and simplicity.

---

### Webhook Events Reference

| Event | Description | Action |
|-------|-------------|--------|
| `checkout.session.completed` | Payment successful | Grant access, record purchase |
| `account.updated` | Creator account status changed | Update local database |
| `account.external_account.created` | Bank account added | Update account status |
| `payout.created` | Payout initiated | Record payout in database |
| `payout.paid` | Payout successful | Update payout status, send email |
| `payout.failed` | Payout failed | Alert creator, update status |
| `charge.refunded` | Payment refunded | Revoke access, update purchase |
| `charge.dispute.created` | Chargeback initiated | Alert platform, investigate |
| `payment_intent.payment_failed` | Payment failed | Show error to user |

---

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=10
MIN_LIST_PRICE_CENTS=100
MAX_LIST_PRICE_CENTS=100000
REFUND_WINDOW_DAYS=30
AUTO_REFUND_WINDOW_HOURS=24

# URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
STRIPE_CONNECT_REFRESH_URL=https://yourdomain.com/dashboard?tab=earnings
STRIPE_CONNECT_RETURN_URL=https://yourdomain.com/dashboard?tab=earnings&stripe_connected=true
```

---

### Cost Calculator (for creators)

**Template for UI:**

```
List Price: $[INPUT]

Breakdown:
- Stripe fee (2.9% + 30¢): $X.XX
- Platform fee (10%):      $X.XX
                                  
- Your earnings:           $X.XX (XX%)

For 10 sales: $XXX
For 100 sales: $X,XXX
```

**Example ($10 list):**

```
List Price: $10.00

Breakdown:
- Stripe fee (2.9% + 30¢): $0.59
- Platform fee (10%):      $1.00
                                  
- Your earnings:           $8.41 (84%)

For 10 sales: $84.10
For 100 sales: $841.00
```

---

### Sample Email Templates

**Purchase Confirmation (to buyer):**

```
Subject: You now have access to [List Name]

Hi [Buyer Name],

Thanks for your purchase! You now have full access to "[List Name]" by @[Creator Username].

Amount paid: $X.XX
Access link: [URL]

You can view this list anytime by logging in to your account.

Need a refund? You have 30 days to request one from your purchase history.

Happy exploring!
[Platform Name]
```

**Sale Notification (to creator):**

```
Subject: You made a sale! =°

Hi [Creator Name],

Great news! Someone just purchased access to your list "[List Name]".

Sale amount: $X.XX
Your earnings: $X.XX (after fees)

Your earnings will be automatically paid out to your bank account within 2 business days.

View details: [Dashboard URL]

Keep up the great work!
[Platform Name]
```

**Payout Confirmation (to creator):**

```
Subject: Your payout is on the way

Hi [Creator Name],

Your payout of $XXX.XX has been sent to your bank account ending in XXXX.

Expected arrival: [Date]

This payout includes earnings from XX sales.

View details: [Dashboard URL]

Questions? Reply to this email or visit our Help Center.

[Platform Name]
```

---

### Testing Checklist

**Stripe Connect:**
- [ ] Creator can complete onboarding
- [ ] Account status updates correctly
- [ ] Dashboard link works
- [ ] Multiple creators can onboard
- [ ] Rejected account shows error

**Payments:**
- [ ] Can set price on list
- [ ] Stripe Product/Price created correctly
- [ ] Checkout session loads
- [ ] Successful payment grants access
- [ ] Failed payment shows error
- [ ] Already-purchased shows "You own this"
- [ ] Creator can view own paid list without purchasing

**Webhooks:**
- [ ] checkout.session.completed processes
- [ ] account.updated processes
- [ ] payout.paid processes
- [ ] charge.refunded processes
- [ ] Duplicate webhooks handled (idempotency)
- [ ] Invalid signature rejected

**Refunds:**
- [ ] Can request refund within 30 days
- [ ] Auto-approved within 24 hours
- [ ] Creator can approve/deny
- [ ] Access revoked on refund
- [ ] Cannot request after 30 days

**Access Control:**
- [ ] Free lists accessible to all
- [ ] Paid lists show paywall
- [ ] After purchase, full access granted
- [ ] After refund, access revoked
- [ ] Creator always has access to own lists

**Analytics:**
- [ ] Revenue chart shows correct data
- [ ] Sales count accurate
- [ ] Conversion rate calculated correctly
- [ ] CSV export includes all transactions
- [ ] Filters work (date range, list)

**Security:**
- [ ] Webhook signatures verified
- [ ] RLS policies prevent unauthorized access
- [ ] API routes require authentication
- [ ] Cannot purchase own list
- [ ] Cannot view other creator's earnings

**Performance:**
- [ ] Checkout loads in <2 seconds
- [ ] Access granted in <5 seconds
- [ ] Dashboard loads in <3 seconds
- [ ] Analytics queries optimized
- [ ] 100 concurrent purchases handled

---

## Conclusion

This PRD outlines a comprehensive implementation plan for paid lists using Stripe Connect. The 6-week timeline is realistic for a complete, production-ready feature with:

 Automatic revenue splitting (10% platform, 90% creator)
 Low transaction fees (2.9% + 30¢)
 Automatic payouts to creators
 Refund handling (30-day window)
 Analytics dashboard
 Full compliance (PCI, tax, legal)
 Scalable architecture

**Next Steps:**
1. Review and approve this PRD
2. Set up Stripe Connect account
3. Begin Phase 1: Database & Infrastructure
4. Proceed through phases sequentially
5. Soft launch with beta creators
6. Public launch

**Estimated Development Cost:** $36,000 (6 weeks @ $150/hr, 40 hrs/week)
**Break-even:** ~7,200 transactions at $5 each
**Time to Break-even:** 10 months at 720 transactions/month

The feature positions the platform for sustainable revenue growth while providing creators with a powerful monetization tool.
