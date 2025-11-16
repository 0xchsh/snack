# Stripe API Endpoints

This document describes all the Stripe-related API endpoints for the paywalled lists feature.

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Stripe keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe webhook secret (get from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Endpoints

### 1. Stripe Connect Onboarding

**POST** `/api/stripe/connect/onboard`

Creates or retrieves a Stripe Connect account for the authenticated user and generates an onboarding link.

**Authentication:** Required

**Request Body:** None (optional custom URLs)

**Response:**
```json
{
  "data": {
    "url": "https://connect.stripe.com/setup/s/...",
    "account_id": "acct_..."
  },
  "message": "Onboarding link generated successfully"
}
```

**What it does:**
1. Checks if user already has a Stripe Connect account
2. Creates new Express account if needed
3. Saves account ID to database
4. Generates onboarding link for user to complete setup
5. Returns URL to redirect user to

**Usage:**
```typescript
const response = await fetch('/api/stripe/connect/onboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
})
const { data } = await response.json()
// Redirect user to data.url
window.location.href = data.url
```

---

### 2. Stripe Connect Status

**GET** `/api/stripe/connect/status`

Checks the Stripe Connect account status for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "data": {
    "connected": true,
    "onboarding_complete": true,
    "account_id": "acct_...",
    "charges_enabled": true,
    "payouts_enabled": true,
    "details_submitted": true
  }
}
```

**What it does:**
1. Retrieves user's Stripe account ID from database
2. Fetches account details from Stripe API
3. Determines if account can receive payments
4. Updates local status in database if changed
5. Returns account status

**Usage:**
```typescript
const response = await fetch('/api/stripe/connect/status')
const { data } = await response.json()

if (!data.connected) {
  // Show "Connect Stripe" button
} else if (!data.onboarding_complete) {
  // Show "Complete Setup" message
} else {
  // User can receive payments!
}
```

---

### 3. Create Checkout Session

**POST** `/api/lists/[listId]/checkout`

Creates a Stripe Checkout session for purchasing a list.

**Authentication:** Required

**Request Body (optional):**
```json
{
  "success_url": "https://yourapp.com/purchase/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://yourapp.com/username/list-id?purchase=cancelled"
}
```

**Response:**
```json
{
  "data": {
    "session_id": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  },
  "message": "Checkout session created successfully"
}
```

**Validations:**
- User must be authenticated
- List must exist and be public
- List must not be free (price_cents > 0)
- User must not already own the list
- User must not have already purchased the list
- Creator must have connected Stripe account

**What it does:**
1. Validates all conditions above
2. Gets creator's Stripe account ID
3. Creates Stripe Checkout session with:
   - One-time payment mode
   - 20% application fee to platform
   - Transfer to creator's account
   - Metadata for tracking purchase
4. Returns checkout URL

**Usage:**
```typescript
const response = await fetch(`/api/lists/${listId}/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
})
const { data } = await response.json()
// Redirect user to Stripe Checkout
window.location.href = data.url
```

---

### 4. Purchase Status

**GET** `/api/lists/[listId]/purchase-status`

Checks if the authenticated user has purchased this list (or has access to it).

**Authentication:** Optional (returns limited info if not logged in)

**Response:**
```json
{
  "data": {
    "is_purchased": true,
    "is_owner": false,
    "is_free": false,
    "has_access": true,
    "purchase_date": "2025-01-14T12:00:00Z",
    "amount_paid": 500,
    "currency": "usd"
  }
}
```

**What it does:**
1. Gets list details (price, owner, visibility)
2. Determines if list is free
3. Checks if user owns the list
4. Checks if user has purchased the list
5. Computes `has_access` = is_owner OR is_free OR is_purchased
6. Returns purchase details if applicable

**Usage:**
```typescript
const response = await fetch(`/api/lists/${listId}/purchase-status`)
const { data } = await response.json()

if (data.has_access) {
  // Show full list content
} else {
  // Show paywall with "Purchase" button
}
```

---

### 5. Stripe Webhook Handler

**POST** `/api/webhooks/stripe`

Handles Stripe webhook events for payment processing and account updates.

**Authentication:** Verified via Stripe signature

**Events Handled:**

#### `checkout.session.completed`
- Fired when user completes checkout
- Logs the completion
- Actual purchase record created in `payment_intent.succeeded`

#### `payment_intent.succeeded`
- Fired when payment is successful
- Creates purchase record in database with:
  - User ID, List ID
  - Amount paid, currency
  - Platform fee (20%), creator earnings (80%)
  - Stripe payment intent ID, charge ID, receipt URL
- Idempotent (won't create duplicate if already exists)

#### `payment_intent.payment_failed`
- Fired when payment fails
- Logs error for debugging/analytics

#### `account.updated`
- Fired when Stripe Connect account changes
- Updates local `stripe_account_status` in database
- Sets to 'active' if can receive payments, 'pending' otherwise

#### `charge.refunded`
- Fired when payment is refunded
- Finds purchase by charge ID
- Marks purchase as refunded in database

**Setup:**
1. Create webhook in Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Set URL to: `https://yourapp.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

**Security:**
- Verifies webhook signature using `stripe.webhooks.constructEvent()`
- Rejects requests with invalid signatures
- Uses raw request body (not parsed JSON)

---

## Testing Locally

To test webhooks locally, use Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events to local endpoint:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Use test payment methods: https://stripe.com/docs/testing

## Payment Flow

1. **User clicks "Purchase List"**
   - Frontend calls `POST /api/lists/[listId]/checkout`
   - Gets checkout URL, redirects user

2. **User completes Stripe Checkout**
   - Stripe processes payment
   - Sends `checkout.session.completed` webhook
   - Sends `payment_intent.succeeded` webhook

3. **Webhook creates purchase record**
   - User now owns the list
   - Can access full content

4. **User returns to app**
   - Frontend calls `GET /api/lists/[listId]/purchase-status`
   - Shows full list content with links

## Creator Payout Flow

1. **Creator connects Stripe**
   - Frontend calls `POST /api/stripe/connect/onboard`
   - Redirects to Stripe onboarding
   - Creator completes KYC/bank account setup

2. **Stripe sends `account.updated` webhook**
   - Updates status to 'active' in database
   - Creator can now receive payments

3. **Buyer purchases list**
   - 20% goes to platform (application fee)
   - 80% goes to creator's Stripe account
   - Money is automatically transferred (Stripe Connect handles this)

4. **Creator receives payout**
   - Stripe automatically pays out to creator's bank account
   - Based on payout schedule (default: daily)

## Platform Fee

- **20% platform fee** on all purchases
- Configured in `src/lib/pricing.ts` as `PLATFORM_FEE_PERCENTAGE = 0.20`
- Implemented as Stripe application fee in checkout session
- Automatically deducted and transferred to platform account

## Price Validation

- Minimum price: **$0.99** (99 cents)
- Maximum price: **$999.00** (99,900 cents)
- Free lists: `price_cents = null` or `price_cents = 0`
- All prices stored in cents to match Stripe API and avoid floating-point errors

## Security Notes

- All endpoints use rate limiting
- Webhook signatures verified
- User authentication required for purchases
- RLS policies enforce access control
- No double-purchases allowed (unique constraint)
- Idempotent webhook processing
