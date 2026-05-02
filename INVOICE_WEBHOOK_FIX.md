# Invoice Webhook Fix - Missing Subscription ID

## Problem Summary

On 2025-12-21 at 10:18:57, the system failed to create a billing transaction for invoice `in_1Sgjhi7kyBl6EleGOTglx3fa` because the invoice webhook event had no `subscription` field attached.

**Error Log:**
```
❌ CRITICAL: Invoice in_1Sgjhi7kyBl6EleGOTglx3fa has no subscription ID - Transaction NOT created
```

**Affected Subscription:**
- ID: `9f585a84-4264-41b3-9d79-f199e1720bf9`
- Site: `mojo.com.lb`
- Plan: `PREMIUM_MONTHLY` ($29)
- Period End: `2025-12-21T10:17:08.000Z`

## Root Cause

The webhook handler (`src/routes/webhooks.ts`) only created billing transactions when invoices had a direct `subscription` field. Some Stripe invoices don't include this field due to:

1. Manual invoices created in Stripe Dashboard
2. One-time payments
3. Timing issues during invoice generation
4. Customer Portal payments for past-due invoices
5. Stripe API quirks in test mode

## Solution Applied

### 1. Code Fix (Already Deployed)

Updated `src/routes/webhooks.ts:552-609` to add fallback logic:

**Before:**
- If invoice has no subscription ID → Log error and skip

**After:**
- If invoice has no subscription ID → Try to find subscription via customer ID
- Look up user's billing info by Stripe customer ID
- Find user's most recent active subscription
- Create transaction using found subscription data

This ensures **all successful payments are recorded**, even without a direct subscription link.

### 2. Manual Cleanup Script

Created `scripts/fix-missing-transaction.ts` to fix the missing transaction for invoice `in_1Sgjhi7kyBl6EleGOTglx3fa`.

**Run on production:**
```bash
cd backend
npx tsx scripts/fix-missing-transaction.ts
```

**What it does:**
1. ✅ Checks if transaction already exists (idempotent)
2. 📋 Fetches invoice details from Stripe
3. 💾 Creates the missing billing transaction
4. 📅 Updates subscription's `currentPeriodEnd` to the next billing cycle

## Verification Steps

### Step 1: Deploy the Code Fix

The code fix has already been applied to `src/routes/webhooks.ts`. Deploy this to production:

```bash
git add src/routes/webhooks.ts
git commit -m "Fix: Handle invoices without subscription ID in webhook handler"
git push
```

### Step 2: Run the Cleanup Script

On your production environment:

```bash
# SSH into production server
cd /path/to/backend
npx tsx scripts/fix-missing-transaction.ts
```

**Expected output:**
```
🔍 Checking if transaction already exists...
📋 Fetching invoice details from Stripe...
   Amount paid: 29.00 USD
   Subscription: NONE
   Customer: cus_xxxxx
🔍 Fetching subscription from database...
   Subscription found: mojo.com.lb
   User: user@example.com
💾 Creating billing transaction...
✅ Transaction created successfully!
   Transaction ID: [uuid]
   Amount: 29 USD
📅 Updating subscription currentPeriodEnd...
   Current: 2025-12-21T10:17:08.000Z
   New: 2026-01-21T10:17:08.000Z
✅ Subscription updated!

🎉 All done! The missing transaction has been created.
```

### Step 3: Verify in Database

Check that the transaction was created:

```sql
SELECT * FROM "BillingTransaction"
WHERE "stripeInvoiceId" = 'in_1Sgjhi7kyBl6EleGOTglx3fa';
```

Check that the subscription was updated:

```sql
SELECT id, "currentPeriodEnd", status
FROM "Subscription"
WHERE id = '9f585a84-4264-41b3-9d79-f199e1720bf9';
```

### Step 4: Monitor Future Renewals

When the next billing cycle occurs (approximately 1 month from the fix), monitor logs to ensure:

1. ✅ Stripe sends `invoice.payment_succeeded` webhook
2. ✅ Webhook handler processes successfully (no errors)
3. ✅ Billing transaction is created
4. ✅ Subscription `currentPeriodEnd` is updated

## Testing the Fix

To test the fix works for future invoices without subscription IDs:

### Option 1: Use Stripe CLI
```bash
stripe trigger invoice.payment_succeeded
```

### Option 2: Manually in Stripe Dashboard
1. Go to Stripe Dashboard → Customers
2. Find the customer
3. Create a new invoice (without linking to a subscription)
4. Mark as paid
5. Check webhook logs for successful processing

### Option 3: Wait for Next Renewal
The most reliable test is to wait for the next automatic renewal (in ~30 days).

## Prevention

The code fix prevents this issue from recurring by:

1. **Primary path**: Invoice has subscription ID → Direct lookup
2. **Fallback path**: Invoice has no subscription ID → Customer-based lookup
3. **Comprehensive logging**: All paths log detailed information for debugging

## Related Files

- `src/routes/webhooks.ts` - Webhook handler with fix
- `scripts/fix-missing-transaction.ts` - One-time cleanup script
- `src/services/billing/BillingService.ts` - Billing logic (unaffected)

## Questions?

If you encounter any issues:

1. Check logs for webhook processing errors
2. Verify Stripe webhook endpoint is reachable
3. Ensure `STRIPE_WEBHOOK_SECRET` is configured correctly
4. Check Stripe Dashboard → Developers → Webhooks for failed events

## Rollback Plan

If the fix causes issues, rollback by reverting the webhook handler:

```bash
git revert [commit-hash]
git push
```

The old behavior will return (invoices without subscription IDs will be skipped with an error log).
