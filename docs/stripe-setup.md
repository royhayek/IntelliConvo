# Stripe Setup Guide

This guide covers how to set up Stripe for payment processing in IntelligentConvo.

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
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`)

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

3. Trigger test events:
   ```bash
   # Trigger a test payment intent
   stripe trigger payment_intent.succeeded

   # Trigger a subscription creation
   stripe trigger customer.subscription.created
   ```

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
