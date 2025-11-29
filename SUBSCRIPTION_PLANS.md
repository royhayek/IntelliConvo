# Subscription Plans & Limits Documentation

This document outlines the subscription system, plan limits, and trial configuration for IntelliConvo. Use this as a reference when implementing features across backend, frontend, and widget.

---

## Table of Contents

1. [Subscription Plans](#subscription-plans)
2. [Plan Limits](#plan-limits)
3. [Trial System](#trial-system)
4. [Implementation Checklist](#implementation-checklist)
5. [API Reference](#api-reference)
6. [Stripe Setup](#stripe-setup)

---

## Subscription Plans

### Plan Types

| Plan ID | Name | Price | Billing | Description |
|---------|------|-------|---------|-------------|
| `PREMIUM_MONTHLY` | Premium Monthly | $29/month | Monthly | Full access to all features |
| `PREMIUM_ANNUAL` | Premium Annual | $279/year | Yearly | Full access + 2 months free (save ~20%) |

### Plan Features

Both plans include the same features (displayed in UI):

```typescript
const PLAN_FEATURES = {
  PREMIUM_MONTHLY: [
    'Unlimited conversations',
    'Advanced analytics',
    'Custom branding',
    'Priority support',
    'API access',
  ],
  PREMIUM_ANNUAL: [
    'Unlimited conversations',
    'Advanced analytics',
    'Custom branding',
    'Priority support',
    'API access',
    '2 months free',
  ],
};
```

### Subscription Statuses

| Status | Description |
|--------|-------------|
| `TRIAL` | User is in trial period (if trial enabled) |
| `ACTIVE` | Paid subscription is active |
| `CANCELLED` | Subscription cancelled but still valid until period end |
| `EXPIRED` | Subscription has ended |

---

## Plan Limits

### Configurable Settings (Admin Panel)

All limits are configurable via System Settings in the admin panel:

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `billing.maxUrlsPerSite` | NUMBER | 500 | Maximum URLs that can be crawled per site |
| `billing.trialEnabled` | BOOLEAN | false | Enable/disable trial feature |
| `billing.trialDays` | NUMBER | 1 | Trial duration in days |
| `billing.trialMaxConversations` | NUMBER | 5 | Max conversations during trial |
| `billing.trialMaxMessages` | NUMBER | 20 | Max messages during trial |

### URL Limits

| User Type | Max URLs | Discovery Limit | Notes |
|-----------|----------|-----------------|-------|
| All Users | 500 (configurable) | 2000 | Same for trial and paid users |

**Rationale:** Payment is required for embeddings, not crawling. Users can discover/crawl freely, but the widget won't work without embeddings (which require payment).

### Conversation/Message Limits

| User Type | Conversations | Messages | Time Limit |
|-----------|---------------|----------|------------|
| Trial | 5 | 20 | 1 day |
| Paid (Active) | Unlimited | Unlimited | Until subscription ends |

---

## Trial System

### How Trial Works

Trial uses a **hybrid model** - expires on whichever limit is hit first:

```
User creates site → Pays → Embeddings generated → Trial starts
                                                       ↓
                    ┌──────────────────────────────────┼──────────────────────────────────┐
                    ↓                                  ↓                                  ↓
              Time expires                    Conversations hit                    Messages hit
              (1 day default)                 (5 default)                          (20 default)
                    ↓                                  ↓                                  ↓
                    └──────────────────────────────────┴──────────────────────────────────┘
                                                       ↓
                                             Trial Expired → Must upgrade
```

### Trial Status Response

```typescript
interface TrialStatus {
  isInTrial: boolean;           // Currently in trial period
  trialExpired: boolean;        // Trial has ended
  reason?: string;              // Why trial expired (if applicable)
  daysRemaining?: number;       // Days left in trial
  conversationsRemaining?: number;  // Conversations left
  messagesRemaining?: number;   // Messages left
}
```

### Trial Expiration Reasons

| Reason | Description |
|--------|-------------|
| `Trial period has ended` | Time-based expiry |
| `Trial limit reached: X conversations` | Conversation limit hit |
| `Trial limit reached: X messages` | Message limit hit |
| `No active subscription` | Never had a subscription |

---

## Implementation Checklist

### Backend

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| Settings Keys | `src/lib/settings.ts` | ✅ Done | Trial and limit setting keys |
| Plan Limits | `src/config/planLimits.ts` | ✅ Done | `getSitePlanLimits()`, `checkTrialStatus()` |
| Socket Handler | `src/services/socket.ts` | ✅ Done | Check trial before messages |
| Discovery Service | `src/services/discovery/UrlDiscoveryService.ts` | ✅ Done | Enforce URL limits |
| Sites Routes | `src/routes/sites.ts` | ✅ Done | Enforce limits on selective crawl, trial status endpoint |
| Subscription Service | `src/services/subscription/SubscriptionService.ts` | ✅ Done | Plan features, Stripe integration |

### Frontend

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| URL Selection | `app/onboarding/components/UrlSelectionStep.tsx` | ✅ Done | Show URL limits, warnings |
| Analyzing Step | `app/onboarding/components/AnalyzingStep.tsx` | ✅ Done | Progress with ETA |
| Plan Step | `app/onboarding/components/PlanStep.tsx` | ✅ Done | Display plans and features |
| Trial Status Hook | `lib/hooks/useTrialStatus.ts` | ✅ Done | Fetch and manage trial status |
| Trial Status Banner | `components/site/trial-status-banner.tsx` | ✅ Done | Display trial status with progress bars |
| Site Dashboard | `app/sites/[siteId]/page.tsx` | ✅ Done | Show trial status banner |
| Billing Page | `app/account/billing/page.tsx` | ✅ Done | Show trial status banner |

### Widget

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| Socket Manager | `src/managers/SocketManager.ts` | ✅ Done | Handle `trial-expired` socket event |
| Trial Message | `src/index.ts` | ✅ Done | `displayTrialExpiredMessage()` method |
| Trial Styles | `src/styles.css` | ✅ Done | Trial expired message styling |
| Remaining Counter | N/A | ⬜ TODO | (Optional) Show remaining messages in header |

---

## API Reference

### Get Plans

```
GET /api/v1/billing/plans
```

Response:
```json
[
  {
    "id": "PREMIUM_MONTHLY",
    "name": "Premium Monthly",
    "description": "Full access to all features, billed monthly",
    "price": 29,
    "currency": "USD",
    "interval": "monthly",
    "features": [
      "Unlimited conversations",
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "API access"
    ],
    "trialDays": 1
  },
  {
    "id": "PREMIUM_ANNUAL",
    "name": "Premium Annual",
    "description": "Full access to all features, billed annually (save 20%)",
    "price": 279,
    "currency": "USD",
    "interval": "annual",
    "features": [
      "Unlimited conversations",
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "API access",
      "2 months free"
    ],
    "trialDays": 1
  }
]
```

### Get Discovery Results (includes limits)

```
GET /api/v1/sites/:siteId/discovery
```

Response:
```json
{
  "status": "COMPLETED",
  "urls": [...],
  "sitemapFound": true,
  "totalCount": 150,
  "selectedCount": 45,
  "estimatedCrawlTime": 90,
  "planLimits": {
    "maxUrls": 500,
    "discoveryLimit": 2000,
    "isAtLimit": false
  }
}
```

### Socket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `message` | `{ sessionId, siteId, content }` | Send chat message |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `trial-expired` | `{ reason, daysRemaining, conversationsRemaining, messagesRemaining }` | Trial limit reached |
| `error` | `{ message, code }` | Error (code: `TRIAL_EXPIRED` for trial issues) |
| `stream` | `{ chunk }` | AI response chunk |
| `complete` | `{ messageId, content }` | Response complete |

---

## Stripe Setup

### 1. Create Products in Stripe Dashboard

**Product 1: Premium Monthly**
- Name: `Premium Monthly`
- Description: `Full access to all features, billed monthly`
- Price: `$29.00 USD` / month

**Product 2: Premium Annual**
- Name: `Premium Annual`
- Description: `Full access to all features, billed annually (save 20%)`
- Price: `$279.00 USD` / year

### 2. Configure Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard)
STRIPE_PRICE_MONTHLY=price_1ABC123...
STRIPE_PRICE_ANNUAL=price_1DEF456...
```

### 3. Configure Webhook Events

Set up webhook endpoint: `https://yourdomain.com/api/v1/webhooks/stripe`

Required events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### 4. Enable Trial (Optional)

In Admin Panel → System Settings → Billing:

| Setting | Value |
|---------|-------|
| Trial Enabled | `true` |
| Trial Days | `1` (or your preference) |
| Trial Max Conversations | `5` |
| Trial Max Messages | `20` |

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. ONBOARDING
   ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │ Enter    │───►│ Discover     │───►│ Select URLs  │───►│ Choose Plan  │
   │ Site URL │    │ URLs         │    │ (max 500)    │    │              │
   └──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                              │                    │
                                              │                    ▼
                                              │            ┌──────────────┐
                                              │            │ Stripe       │
                                              │            │ Checkout     │
                                              │            └──────────────┘
                                              │                    │
                                              ▼                    ▼
                                       ┌──────────────┐    ┌──────────────┐
                                       │ Crawl Pages  │◄───│ Payment      │
                                       │              │    │ Success      │
                                       └──────────────┘    └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ Generate     │
                                       │ Embeddings   │
                                       └──────────────┘
                                              │
                                              ▼
2. ACTIVE USE              ┌──────────────────┴──────────────────┐
                           │                                      │
                    Trial Enabled?                         Trial Disabled
                           │                                      │
                    ┌──────┴──────┐                               │
                    ▼             ▼                               ▼
             ┌──────────┐  ┌──────────┐                    ┌──────────┐
             │ Trial    │  │ Paid     │                    │ Paid     │
             │ (limited)│  │ (full)   │                    │ (full)   │
             └──────────┘  └──────────┘                    └──────────┘
                    │             │                               │
                    ▼             │                               │
             ┌──────────┐        │                               │
             │ Limit    │        │                               │
             │ Reached  │        │                               │
             └──────────┘        │                               │
                    │             │                               │
                    ▼             │                               │
             ┌──────────┐        │                               │
             │ Upgrade  │────────┘                               │
             │ Prompt   │                                        │
             └──────────┘                                        │
                                                                 │
3. WIDGET CHAT                                                   │
                                                                 ▼
                                                          ┌──────────┐
                                                          │ Widget   │
                                                          │ Active   │
                                                          └──────────┘
```

---

## Future Considerations

### Potential Plan Tiers (Not Implemented)

If you want to add more tiers in the future:

| Plan | Price | Max URLs | Features |
|------|-------|----------|----------|
| Starter | $19/mo | 100 | Basic features |
| Pro | $49/mo | 1000 | All features + priority |
| Enterprise | Custom | Unlimited | Custom + SLA |

### Additional Limits to Consider

- Max sites per user
- Max file uploads per site
- Max file size
- API rate limits per plan
- Custom branding options per plan

---

## Changelog

| Date | Change |
|------|--------|
| 2024-11-24 | Initial document created |
| 2024-11-24 | Added trial system (hybrid: time + conversations + messages) |
| 2024-11-24 | Made all limits configurable via admin settings |
| 2024-11-24 | Seeded default trial settings to database |
| 2024-11-24 | Implemented widget trial-expired handling with UI message |
| 2024-11-24 | Added trial status API endpoint (`GET /api/v1/sites/:siteId/trial-status`) |
| 2024-11-24 | Created `useTrialStatus` hook and `TrialStatusBanner` component |
| 2024-11-24 | Added trial banner to site dashboard and billing page |
