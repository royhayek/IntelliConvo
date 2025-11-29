# Stripe Setup Guide

This guide covers how to set up Stripe for payment processing in IntelliConvo.

## Overview

Stripe is used for subscription billing and payments. The system automatically detects test vs live mode based on your API key prefix:

- `sk_test_...` = Sandbox mode (no real charges)
- `sk_live_...` = Production mode (real charges)

---

## 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create an account and verify your email
3. Complete your business profile (required for live mode)

---

## 2. Get Your API Keys

1. Navigate to **Developers** → **API keys** in the Stripe dashboard
2. Toggle between **Test mode** and **Live mode** at the top of the dashboard
3. Copy the **Secret key**:
   - Test mode: `sk_test_...`
   - Live mode: `sk_live_...`

> **Important**: Never expose your secret key in client-side code or commit it to version control.

---

## 3. Create Products & Prices

### Premium Monthly

| Field | Value |
|-------|-------|
| **Name** | Premium Monthly |
| **Description** | Full access to all features, billed monthly |
| **Pricing Model** | Recurring |
| **Price** | $29.00 USD |
| **Billing Period** | Monthly |

**Features included:**
- Unlimited conversations
- Advanced analytics
- Custom branding
- Priority support
- API access

### Premium Annual

| Field | Value |
|-------|-------|
| **Name** | Premium Annual |
| **Description** | Full access to all features, billed annually (save 20%) |
| **Pricing Model** | Recurring |
| **Price** | $279.00 USD |
| **Billing Period** | Yearly |

**Features included:**
- Unlimited conversations
- Advanced analytics
- Custom branding
- Priority support
- API access
- 2 months free

### Steps to Create in Stripe Dashboard

1. Go to **Products** → **Add product**
2. Enter the product name and description
3. Under **Pricing**, select **Recurring**
4. Set the price and billing period
5. Click **Save product**
6. Copy the **Price ID** (e.g., `price_1ABC123...`)

---

## 4. Set Up Webhooks

Webhooks notify your application of events like successful payments, subscription changes, etc.

### For Local Development

Install and use the Stripe CLI:

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Install Stripe CLI (Windows)
scoop install stripe

# Install Stripe CLI (Linux)
# Download from https://github.com/stripe/stripe-cli/releases

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
```

The CLI will output a webhook signing secret (`whsec_...`) - copy this for your `.env` file.

### For Production

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL:
   ```
   https://yourdomain.com/api/v1/webhooks/stripe
   ```
4. Select these events to listen for:

   **Required (Core Subscription Lifecycle):**
   - `checkout.session.completed` - Payment completed
   - `customer.subscription.created` - New subscription
   - `customer.subscription.updated` - Subscription changes (including cancellation scheduling)
   - `customer.subscription.deleted` - Subscription terminated
   - `customer.subscription.trial_will_end` - Trial ending reminder (3 days before)

   **Required (Payments):**
   - `invoice.payment_succeeded` - Successful payment/renewal
   - `invoice.payment_failed` - Failed payment

   **Required (Refunds & Disputes):**
   - `charge.refunded` - Refund processed
   - `charge.dispute.created` - Chargeback/dispute opened

5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`)

> **Important**: For local development using `stripe listen`, you don't need to configure the Dashboard. The Stripe CLI automatically forwards ALL events to your local server. Dashboard webhook configuration is only required for production deployments.

---

## 5. Environment Variables

Add these variables to your `backend/.env` file:

```bash
# Stripe Secret Key
# Use sk_test_... for development, sk_live_... for production
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Webhook Secret
# From Stripe CLI (local) or Webhook settings (production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs
# Copy from Products → [Product] → Pricing
STRIPE_PRICE_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_ANNUAL=price_your_annual_price_id
```

---

## 6. Testing

### Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 3220` | 3D Secure 2 authentication |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Declined (generic) |

**For all test cards:**
- Use any future expiration date (e.g., `12/34`)
- Use any 3-digit CVC (e.g., `123`)
- Use any billing postal code (e.g., `12345`)

### Testing Webhooks Locally

1. Start your backend server:
   ```bash
   cd backend && npm run dev
   ```

2. In a separate terminal, start Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
   ```

   > **Note**: Copy the webhook signing secret (`whsec_...`) from the output and update your `STRIPE_WEBHOOK_SECRET` in `.env`. This secret changes each time you restart `stripe listen`.

3. Trigger test events:
   ```bash
   # Trigger a checkout session completion (new subscription)
   stripe trigger checkout.session.completed

   # Trigger subscription lifecycle events
   stripe trigger customer.subscription.created
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted

   # Trigger payment events
   stripe trigger invoice.payment_succeeded
   stripe trigger invoice.payment_failed

   # Trigger refund event
   stripe trigger charge.refunded

   # Trigger dispute event
   stripe trigger charge.dispute.created
   ```

4. View webhook event logs in real-time:
   ```bash
   # The stripe listen command shows events as they're received
   # Look for "200 OK" responses to confirm your server handled them
   ```

5. Verify events in the Stripe Dashboard:
   - Go to **Developers** → **Events** to see all triggered events
   - Click on an event to see the full payload and response from your server

### Testing Complete Subscription Flow Locally

To test the full subscription flow end-to-end:

1. **Create a test customer and subscription via the UI:**
   - Use test card `4242 4242 4242 4242`
   - Complete the checkout flow in your frontend
   - Watch the `stripe listen` terminal for incoming webhooks

2. **Simulate subscription changes:**
   ```bash
   # List recent subscriptions
   stripe subscriptions list --limit 3

   # Cancel a subscription (replace sub_xxx with actual ID)
   stripe subscriptions cancel sub_xxx

   # Update a subscription
   stripe subscriptions update sub_xxx --proration-behavior=none
   ```

3. **Simulate failed payments:**
   - Use test card `4000 0000 0000 0341` - Attaches but fails on first charge
   - Or update a subscription's payment method to a failing card

4. **Resend a webhook event:**
   ```bash
   # List recent events
   stripe events list --limit 10

   # Resend a specific event (replace evt_xxx with actual ID)
   stripe events resend evt_xxx
   ```

### Debugging Webhook Issues

If webhooks aren't working:

1. **Check if events are being received:**
   - Look at the `stripe listen` terminal output
   - Should show: `-->  POST http://localhost:5000/api/v1/webhooks/stripe [evt_xxx]`
   - And response: `<--  [200] POST http://localhost:5000/api/v1/webhooks/stripe`

2. **Check server logs:**
   ```bash
   # Backend logs will show webhook processing
   tail -f backend/logs/all.log
   ```

3. **Common issues:**
   - Wrong `STRIPE_WEBHOOK_SECRET` - Must match the one from `stripe listen`
   - Server not running on correct port
   - Webhook endpoint returning errors (check backend logs)

---

## 7. Going Live Checklist

Before switching to live mode:

- [ ] Complete Stripe account verification
- [ ] Add business details and bank account
- [ ] Replace `sk_test_...` with `sk_live_...` in production environment
- [ ] Create products/prices in live mode (they don't sync from test mode)
- [ ] Update `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL` with live price IDs
- [ ] Set up production webhook endpoint
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production signing secret
- [ ] Test with a real card (you can refund immediately)

---

## Troubleshooting

### "No such price" Error

- Ensure you're using the correct price IDs for your mode (test vs live)
- Price IDs from test mode won't work with live API keys and vice versa

### Webhook Signature Verification Failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches your environment (local CLI vs production)
- For local development, use the secret from `stripe listen` output
- The webhook secret changes each time you run `stripe listen`

### "Invalid API Key" Error

- Check that your API key is correct and hasn't been rotated
- Ensure you're not mixing test/live keys

### Subscription Not Updating

- Verify webhooks are being received (check Stripe Dashboard → Developers → Webhooks → Events)
- Check backend logs for webhook processing errors
- Ensure all required webhook events are selected

---

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)
- [Webhook Events Reference](https://stripe.com/docs/api/events/types)
