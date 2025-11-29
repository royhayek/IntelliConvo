# Admin Portal Analysis

## Executive Summary

This document analyzes the requirements and approach for implementing an admin portal for the IntelliConvo SaaS platform. The admin portal will provide platform administrators with visibility into system-wide statistics, user management, and operational oversight.

---

## 1. Current State Analysis

### What Exists Today

| Component | Status |
|-----------|--------|
| User-facing dashboard | ✅ Complete |
| Account management | ✅ Complete (user-level only) |
| Site management | ✅ Complete |
| Authentication system | ✅ Complete (JWT + OAuth) |
| **Admin portal** | ❌ Does not exist |
| **Admin role/permissions** | ❌ No role-based access control |

### Current Authorization Model

The existing system uses **ownership-based authorization**:
- Users can only access their own resources
- No concept of admin roles or elevated permissions
- All API endpoints check `userId` ownership

---

## 2. Database Entities - Complete Analysis

Based on the Prisma schema, here is a **complete inventory** of all 14 database models and their admin portal visibility:

### Complete Entity Inventory

| # | Entity | Dedicated Page | Admin Value | Priority |
|---|--------|---------------|-------------|----------|
| 1 | **User** | ✅ Yes | Core user management | High |
| 2 | **BillingInfo** | ✅ Yes | Billing support, Stripe customer lookup | Medium |
| 3 | **Site** | ✅ Yes | Core site management | High |
| 4 | **WidgetSettings** | ✅ Yes | Widget debugging, support tickets | Medium |
| 5 | **SiteUrl** | ✅ Yes | URL crawl status, content issues | High |
| 6 | **Embedding** | ✅ Yes | **Vector DB health, failed embeddings, troubleshooting** | High |
| 7 | **ConversationStarter** | ⚡ Optional | Cross-site starter management | Low |
| 8 | **Conversation** | ✅ Yes | Chat monitoring, user support | High |
| 9 | **Message** | ✅ Yes | Message search, content moderation | Medium |
| 10 | **KnowledgeFile** | ✅ Yes | **File processing status, failed uploads** | High |
| 11 | **ActiveHost** | ⚡ Optional | Domain whitelist oversight | Low |
| 12 | **Subscription** | ✅ Yes | Subscription management, billing issues | High |
| 13 | **BillingTransaction** | ✅ Yes | Payment history, refunds | High |
| 14 | **RefreshToken** | ✅ Yes | **Security: active sessions, force logout** | Medium |

### Detailed Entity Analysis

#### Tier 1: Core Management (Must Have)

| Entity | Key Admin Use Cases | Critical Fields |
|--------|---------------------|-----------------|
| **User** | View all users, update profiles, disable accounts, promote to admin | email, fullName, authProvider, isAdmin, createdAt, lastLoginAt |
| **Site** | View all sites, troubleshoot crawl issues, manual status updates | siteName, siteUrl, crawlStatus, userId, lastCrawledAt |
| **Subscription** | Manage plans, extend trials, handle cancellations, billing support | planType, status, trialEndsAt, stripeSubscriptionId |
| **Conversation** | Monitor usage, support investigations, analyze engagement | sessionId, messageCount, siteId, startedAt, lastMessageAt |
| **BillingTransaction** | Payment issues, refund processing, revenue tracking | amount, status, stripeInvoiceId, invoiceId |

#### Tier 2: Technical Operations (Important for Support)

| Entity | Key Admin Use Cases | Critical Fields |
|--------|---------------------|-----------------|
| **SiteUrl** | Troubleshoot crawling, view content status, exclude problematic URLs | url, isActive, isExcluded, lastCrawledAt, contentHash |
| **Embedding** | **Debug vector search issues, identify failed embeddings, re-process content** | vectorId, chunkIndex, siteUrlId, createdAt |
| **KnowledgeFile** | **Monitor file processing, identify stuck/failed uploads, re-trigger processing** | fileName, fileType, status, errorMessage, processedAt |
| **Message** | Search conversations, content moderation, analyze AI responses | role, content, timestamp, tokensUsed, costInCents |

#### Tier 3: Security & Support

| Entity | Key Admin Use Cases | Critical Fields |
|--------|---------------------|-----------------|
| **RefreshToken** | **View active sessions, force logout suspicious sessions, security audits** | token (hashed display), userId, expiresAt, createdAt |
| **BillingInfo** | Stripe customer lookup, billing address verification | stripeCustomerId, fullName, email, country |
| **WidgetSettings** | Debug widget issues, view custom configurations, support tickets | All 100+ settings fields, customCss |

#### Tier 4: Optional/Low Priority

| Entity | Key Admin Use Cases | Notes |
|--------|---------------------|-------|
| **ConversationStarter** | View/manage starter questions across sites | Can be viewed in Site detail |
| **ActiveHost** | Domain whitelist management | Can be viewed in Site detail |

---

### Why Embeddings Need a Dedicated Admin Page

The `Embedding` table is critical for admin visibility:

```
Embedding
├── id              → Unique identifier
├── siteUrlId       → Link to source URL
├── content         → Original content chunk
├── contentChunk    → Processed chunk text
├── chunkIndex      → Order within document
├── vectorId        → Pinecone vector ID (critical for debugging)
└── createdAt       → When embedding was created
```

**Admin Use Cases:**
1. **Failed Embedding Detection**: Find URLs that were crawled but have no embeddings
2. **Vector DB Sync Issues**: Compare Prisma records vs Pinecone vectors
3. **Re-processing**: Trigger re-embedding of specific content
4. **Debugging Search**: Understand why certain content isn't being found
5. **Cost Analysis**: Track embedding volume and costs

**Dashboard Metrics Needed:**
- Total embeddings count
- Embeddings created today/week
- URLs without embeddings (potential failures)
- Average chunks per URL
- Pinecone index usage

---

### Why KnowledgeFile Needs a Dedicated Admin Page

```
KnowledgeFile
├── id              → Unique identifier
├── siteId          → Parent site
├── fileName        → Original filename
├── fileType        → MIME type
├── fileSize        → Size in bytes
├── fileUrl         → Storage path
├── status          → PENDING | COMPLETED | FAILED
├── errorMessage    → Why processing failed
├── uploadedAt      → Upload timestamp
└── processedAt     → Processing completion time
```

**Admin Use Cases:**
1. **Processing Failures**: Find all failed file uploads and their error messages
2. **Stuck Files**: Find files in PENDING status for too long
3. **Re-process Files**: Trigger reprocessing of failed files
4. **Storage Management**: View total storage usage
5. **Support**: Help users with upload issues

**Dashboard Metrics Needed:**
- Files by status (Pending/Completed/Failed)
- Processing success rate
- Total storage used
- Files stuck in processing (>10 min)

---

### Why RefreshToken Needs Admin Visibility

```
RefreshToken
├── id              → Unique identifier
├── token           → The refresh token (show hashed/truncated)
├── userId          → Owner user
├── expiresAt       → When token expires
└── createdAt       → When token was issued
```

**Admin Use Cases:**
1. **Security Audits**: View all active sessions for a user
2. **Force Logout**: Invalidate all tokens for a compromised account
3. **Suspicious Activity**: Detect unusual session patterns
4. **Support**: Help users who can't log out of old sessions

**Dashboard Metrics Needed:**
- Total active sessions
- Sessions by user (identify heavy users)
- Expired but not cleaned tokens
- Sessions created in last 24h

---

## 3. Proposed Admin Portal Structure

### Complete Frontend Page Structure

```
/admin
├── /                               → Dashboard (comprehensive statistics)
│
├── /users                          → Users management
│   ├── page.tsx                    → Users table (search, filter, paginate)
│   └── /[userId]/page.tsx          → User detail (profile, sites, subscriptions, billing, sessions)
│
├── /sites                          → Sites management
│   ├── page.tsx                    → Sites table (all sites across users)
│   └── /[siteId]/page.tsx          → Site detail (tabs: overview, urls, files, conversations, widget, starters, hosts)
│
├── /urls                           → Site URLs management
│   └── page.tsx                    → All URLs table (filter by site, status, crawl date)
│
├── /embeddings                     → Vector embeddings monitoring
│   └── page.tsx                    → Embeddings table (filter by site, URL, date, show orphans)
│
├── /files                          → Knowledge files management
│   └── page.tsx                    → All files table (filter by status: pending/completed/failed)
│
├── /conversations                  → Conversation monitoring
│   ├── page.tsx                    → Conversations table (filter by site, date range)
│   └── /[conversationId]/page.tsx  → Conversation detail (full message thread)
│
├── /messages                       → Message search (optional)
│   └── page.tsx                    → Search all messages across conversations
│
├── /subscriptions                  → Subscription management
│   └── page.tsx                    → Subscriptions table (filter by status, plan)
│
├── /billing                        → Billing overview
│   ├── /transactions/page.tsx      → All transactions table
│   └── /info/page.tsx              → Billing info records (Stripe customer data)
│
├── /widgets                        → Widget configurations
│   └── page.tsx                    → Widget settings overview (for debugging)
│
├── /sessions                       → Security: Active sessions
│   └── page.tsx                    → RefreshToken table (force logout, security audit)
│
└── /settings                       → Admin portal settings (future)
    └── page.tsx                    → Admin configuration, audit logs
```

### Sidebar Navigation Structure

```
📊 Dashboard
─────────────────
👥 Users
🌐 Sites
🔗 URLs
─────────────────
🧠 Embeddings        ← NEW (Technical Operations)
📁 Knowledge Files   ← NEW (Technical Operations)
─────────────────
💬 Conversations
📝 Messages          ← NEW (Search all messages)
─────────────────
💳 Subscriptions
💰 Transactions
📋 Billing Info      ← NEW (Stripe customer data)
─────────────────
🎨 Widgets           ← NEW (Debug widget configs)
🔐 Sessions          ← NEW (Security)
⚙️ Settings
```

### Comprehensive Dashboard Metrics

The main dashboard (`/admin`) should display metrics grouped by category:

#### User & Growth Metrics
| Metric | Description |
|--------|-------------|
| Total Users | Count with trend arrow (vs last week) |
| New Users Today | Users registered today |
| New Users This Week | Weekly registration count |
| Users by Auth Provider | Pie chart: Email, Google, GitHub |
| Active Users (7d) | Users with activity in last 7 days |
| Active Users (30d) | Users with activity in last 30 days |

#### Site & Crawling Metrics
| Metric | Description |
|--------|-------------|
| Total Sites | All sites across platform |
| Sites by Crawl Status | Breakdown: Pending, Crawling, Completed, Failed |
| Failed Crawls (24h) | Sites that failed crawling recently |
| Total URLs Indexed | Sum of all SiteUrl records |
| URLs Pending Crawl | URLs waiting to be crawled |

#### Embedding & Vector DB Metrics ← NEW
| Metric | Description |
|--------|-------------|
| Total Embeddings | All embedding records |
| Embeddings Created (24h) | Recent embedding activity |
| URLs Without Embeddings | **Potential failures - needs attention** |
| Average Chunks per URL | Content chunking efficiency |
| Pinecone Index Usage | Vector count in Pinecone (if API available) |

#### Knowledge Files Metrics ← NEW
| Metric | Description |
|--------|-------------|
| Total Files | All uploaded files |
| Files by Status | Pie: Pending, Completed, Failed |
| Failed Files | **Files with errors - needs attention** |
| Stuck Files | Pending for >10 minutes |
| Total Storage | Sum of all file sizes |

#### Conversation & Message Metrics
| Metric | Description |
|--------|-------------|
| Total Conversations | All conversation sessions |
| Active Conversations (24h) | Conversations with recent messages |
| Total Messages | All messages across platform |
| Messages Today | Message volume today |
| Avg Messages/Conversation | Engagement metric |
| Total Tokens Used | AI token consumption |
| Estimated AI Cost | Based on tokensUsed and costInCents |

#### Subscription & Revenue Metrics
| Metric | Description |
|--------|-------------|
| Total Subscriptions | All subscription records |
| Subscriptions by Status | Trial, Active, Cancelled, Expired |
| Subscriptions by Plan | Monthly vs Annual |
| Expiring Trials (7d) | Trials ending soon |
| MRR (Monthly Recurring) | If revenue tracking enabled |

#### Security Metrics ← NEW
| Metric | Description |
|--------|-------------|
| Active Sessions | Non-expired RefreshToken count |
| Sessions Created (24h) | Recent login activity |
| Expired Tokens (cleanup) | Tokens past expiry (need cleanup) |
| Users with Multiple Sessions | Potential security concern |

---

## 4. Reusable Existing Components

### Data Display Components

| Component | Location | Usage |
|-----------|----------|-------|
| `Table`, `TableHeader`, `TableRow`, `TableCell` | `components/ui/table.tsx` | All admin tables |
| `Pagination` | `components/ui/pagination.tsx` | Table pagination |
| `StatsGrid`, `StatCard`, `StatPill` | `components/ui/` | Dashboard metrics |
| `Badge` | `components/ui/badge.tsx` | Status indicators |
| `StatusIndicator` | `components/ui/status-indicator.tsx` | Status badges |
| `EmptyState` | `components/ui/empty-state.tsx` | Empty table states |
| `LoadingSpinner`, `Skeleton` | `components/ui/` | Loading states |
| `PageHeader` | `components/ui/page-header.tsx` | Page titles |
| `Card` | `components/ui/card.tsx` | Content containers |

### Form Components

| Component | Location | Usage |
|-----------|----------|-------|
| `FormInput` | `components/form/form-input.tsx` | Text inputs |
| `FormTextarea` | `components/form/form-textarea.tsx` | Long text |
| `FormSelect` | `components/form/form-select-field.tsx` | Dropdowns |
| `FormToggle` | `components/form/form-toggle-field.tsx` | Boolean toggles |
| `FormNumberField` | `components/form/form-number-field.tsx` | Numbers |

### Dialog Components

| Component | Location | Usage |
|-----------|----------|-------|
| `Dialog` | `components/ui/dialog.tsx` | Modal dialogs |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | Confirmations |
| `DeleteConfirmationDialog` | `components/ui/delete-confirmation-dialog.tsx` | Delete actions |

### Layout Components

| Component | Location | Notes |
|-----------|----------|-------|
| `BreadcrumbNav` | `components/ui/breadcrumb-nav.tsx` | Navigation |
| `Tabs` | `components/ui/tabs.tsx` | Detail page sections |
| `SectionHeader` | `components/ui/section-header.tsx` | Section titles |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `AdminLayout` | Admin-specific layout with sidebar |
| `AdminSidebar` | Navigation sidebar for admin pages |
| `DataTable` | Generic data table with sorting, filtering, pagination |
| `SearchInput` | Search input with debounce |
| `DateRangePicker` | Filter by date range |
| `ExportButton` | Export table data (CSV/JSON) |

---

## 5. API Strategy: Separate Admin Routes

### Recommendation: **Yes, separate admin routes**

Creating separate admin routes (`/api/v1/admin/*`) is the better approach for several reasons:

#### Benefits of Separation

| Benefit | Description |
|---------|-------------|
| **Security isolation** | Admin endpoints can have stricter authentication/authorization |
| **Clear permissions** | Easy to apply admin-only middleware to entire route group |
| **API clarity** | Clear distinction between user and admin operations |
| **Rate limiting** | Different rate limits for admin vs user endpoints |
| **Audit logging** | Easier to add comprehensive logging for admin actions |
| **Swagger organization** | Separate admin tag group in documentation |

#### Complete Route Structure

```
/api/v1/admin/
│
├── /stats                          → Dashboard statistics
│   ├── GET /                       → All dashboard metrics
│   ├── GET /users                  → User-specific stats
│   ├── GET /sites                  → Site-specific stats
│   ├── GET /embeddings             → Embedding/vector stats
│   ├── GET /files                  → File processing stats
│   ├── GET /conversations          → Conversation stats
│   ├── GET /subscriptions          → Subscription stats
│   └── GET /security               → Security/session stats
│
├── /users                          → User management
│   ├── GET /                       → List all users (paginated, searchable)
│   ├── GET /:id                    → User details + related data
│   ├── PATCH /:id                  → Update user (including isAdmin)
│   ├── DELETE /:id                 → Delete/disable user
│   └── POST /:id/force-logout      → Invalidate all user sessions
│
├── /sites                          → Site management
│   ├── GET /                       → List all sites
│   ├── GET /:id                    → Site details (full with relations)
│   ├── PATCH /:id                  → Update site
│   ├── DELETE /:id                 → Delete site
│   └── POST /:id/recrawl           → Trigger site recrawl
│
├── /urls                           → URL management
│   ├── GET /                       → List all URLs (filter by site, status)
│   ├── GET /:id                    → URL details with embeddings
│   ├── PATCH /:id                  → Update URL status
│   └── POST /:id/reprocess         → Re-crawl and re-embed URL
│
├── /embeddings                     → Embedding management (NEW)
│   ├── GET /                       → List embeddings (filter by site, URL)
│   ├── GET /orphans                → URLs without embeddings
│   ├── GET /stats                  → Embedding statistics
│   ├── DELETE /:id                 → Delete embedding
│   └── POST /reprocess             → Bulk re-embed URLs
│
├── /files                          → Knowledge file management (NEW)
│   ├── GET /                       → List all files (filter by status)
│   ├── GET /failed                 → Only failed files
│   ├── GET /stuck                  → Files pending too long
│   ├── PATCH /:id                  → Update file status
│   ├── DELETE /:id                 → Delete file
│   └── POST /:id/reprocess         → Re-process file
│
├── /conversations                  → Conversation management
│   ├── GET /                       → List conversations (filter by site, date)
│   ├── GET /:id                    → Conversation with all messages
│   └── DELETE /:id                 → Delete conversation
│
├── /messages                       → Message search (NEW)
│   ├── GET /                       → Search messages (full-text search)
│   └── GET /stats                  → Message statistics
│
├── /subscriptions                  → Subscription management
│   ├── GET /                       → List subscriptions
│   ├── GET /:id                    → Subscription details
│   ├── PATCH /:id                  → Update subscription (status, dates)
│   └── POST /:id/extend-trial      → Extend trial period
│
├── /billing                        → Billing management (NEW)
│   ├── /transactions
│   │   ├── GET /                   → List all transactions
│   │   └── GET /:id                → Transaction details
│   └── /info
│       ├── GET /                   → List all billing info records
│       └── GET /:id                → Billing info details
│
├── /widgets                        → Widget settings (NEW)
│   ├── GET /                       → List all widget configs
│   └── GET /:siteId                → Widget config for site
│
├── /sessions                       → Session/security management (NEW)
│   ├── GET /                       → List all active sessions
│   ├── GET /user/:userId           → Sessions for specific user
│   ├── DELETE /:id                 → Revoke specific session
│   ├── DELETE /user/:userId        → Revoke all user sessions
│   └── POST /cleanup               → Clean expired tokens
│
└── /audit                          → Audit logs (future)
    └── GET /                       → Admin action history
```

### Swagger Documentation Strategy

#### Option A: Single Swagger with Admin Tag (Recommended)

Keep one Swagger instance but add an `Admin` tag group:

```typescript
// In swagger.ts, add to tags array:
{
  name: 'Admin',
  description: 'Admin-only endpoints for platform management'
}
```

**Pros:**
- Single source of truth for all API documentation
- Easier to maintain
- Developers see full API surface

**Cons:**
- Admin endpoints visible to all (though still protected)

#### Option B: Separate Admin Swagger

Serve admin docs at `/api/admin/docs`:

**Pros:**
- Complete separation
- Can restrict access to admin docs

**Cons:**
- Duplicate configuration
- More maintenance

### Recommendation

**Use Option A (Single Swagger with Admin Tag)** for simplicity. The endpoints are still protected by authentication and admin authorization middleware regardless of documentation visibility.

---

## 6. Authentication & Authorization Changes

### Required Database Changes

Add an `isAdmin` field to the User model:

```prisma
model User {
  // ... existing fields
  isAdmin         Boolean         @default(false)
  // ...
}
```

Alternatively, implement a full role-based system:

```prisma
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

model User {
  // ... existing fields
  role            UserRole        @default(USER)
  // ...
}
```

### New Middleware Required

```typescript
// middleware/adminAuth.ts
export const requireAdmin = async (req, res, next) => {
  // First authenticate the user
  await authenticate(req, res, async () => {
    // Then check admin status
    if (!req.user?.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }
    next();
  });
};
```

### Admin Routes Protection

```typescript
// routes/admin/index.ts
const adminRouter = express.Router();

// Apply admin auth to all admin routes
adminRouter.use(requireAdmin);

adminRouter.use('/stats', statsRoutes);
adminRouter.use('/users', usersRoutes);
adminRouter.use('/sites', sitesRoutes);
// ... etc
```

---

## 7. Implementation Phases

### Phase 1: Foundation & Dashboard

**Database:**
- Add `isAdmin` field to User model
- Run migration: `npx prisma migrate dev --name add_admin_role`
- Seed initial admin user

**Backend:**
1. Create `adminAuth.ts` middleware (requireAdmin)
2. Set up `/api/v1/admin` route group in `index.ts`
3. Implement `/admin/stats` endpoint with all dashboard metrics:
   - User stats (total, new, by provider, active)
   - Site stats (total, by crawl status)
   - Embedding stats (total, orphans, recent)
   - File stats (by status, stuck files)
   - Conversation stats (total, messages, tokens)
   - Subscription stats (by status, by plan)
   - Session stats (active, recent)

**Frontend:**
1. Create `AdminLayout` with sidebar navigation
2. Create `useRequireAdmin` hook for route protection
3. Implement dashboard page with all metric cards
4. Add trend indicators and alert cards

**Deliverable:** Working admin dashboard with comprehensive statistics

---

### Phase 2: User & Site Management

**Backend - Users:**
1. `GET /admin/users` - Paginated list with search, filter by provider/status
2. `GET /admin/users/:id` - Full details with sites, subscriptions, billing, sessions
3. `PATCH /admin/users/:id` - Update user (including isAdmin promotion)
4. `DELETE /admin/users/:id` - Soft delete user
5. `POST /admin/users/:id/force-logout` - Invalidate all user sessions

**Backend - Sites:**
1. `GET /admin/sites` - Paginated list with search, filter by status/user
2. `GET /admin/sites/:id` - Full details with all relations
3. `PATCH /admin/sites/:id` - Update site
4. `DELETE /admin/sites/:id` - Delete site (cascade)
5. `POST /admin/sites/:id/recrawl` - Trigger site recrawl

**Frontend:**
1. Users table page with DataTable component
2. User detail page with tabs (profile, sites, subscriptions, billing, sessions)
3. User edit dialog
4. Sites table page
5. Site detail page (adapt existing tabs structure)
6. Recrawl button with confirmation

**Deliverable:** Full user and site management capabilities

---

### Phase 3: Content Operations (URLs, Embeddings, Files)

**Backend - URLs:**
1. `GET /admin/urls` - All URLs with filter by site, status, crawl date
2. `GET /admin/urls/:id` - URL details with embedding count
3. `PATCH /admin/urls/:id` - Update URL status (active, excluded)
4. `POST /admin/urls/:id/reprocess` - Re-crawl and re-embed

**Backend - Embeddings:**
1. `GET /admin/embeddings` - List with filter by site, URL, date range
2. `GET /admin/embeddings/orphans` - URLs without embeddings
3. `GET /admin/embeddings/stats` - Embedding statistics
4. `DELETE /admin/embeddings/:id` - Delete embedding
5. `POST /admin/embeddings/reprocess` - Bulk re-embed selected URLs

**Backend - Files:**
1. `GET /admin/files` - All files with filter by status, site
2. `GET /admin/files/failed` - Only failed files
3. `GET /admin/files/stuck` - Files pending >10 min
4. `PATCH /admin/files/:id` - Update file status
5. `DELETE /admin/files/:id` - Delete file
6. `POST /admin/files/:id/reprocess` - Re-process file

**Frontend:**
1. URLs table page with status badges
2. Embeddings table page with orphan detection
3. Files table page with status filtering
4. Reprocess buttons and bulk actions

**Deliverable:** Complete content operations visibility and management

---

### Phase 4: Conversations & Messages

**Backend - Conversations:**
1. `GET /admin/conversations` - List with filter by site, date range
2. `GET /admin/conversations/:id` - Full conversation with all messages
3. `DELETE /admin/conversations/:id` - Delete conversation

**Backend - Messages:**
1. `GET /admin/messages` - Full-text search across all messages
2. `GET /admin/messages/stats` - Message statistics (tokens, costs)

**Frontend:**
1. Conversations table page
2. Conversation detail page with full message thread
3. Message search page
4. Token usage and cost display

**Deliverable:** Conversation monitoring and message search

---

### Phase 5: Billing & Subscriptions

**Backend - Subscriptions:**
1. `GET /admin/subscriptions` - List with filter by status, plan
2. `GET /admin/subscriptions/:id` - Full subscription details
3. `PATCH /admin/subscriptions/:id` - Update status, dates
4. `POST /admin/subscriptions/:id/extend-trial` - Extend trial period

**Backend - Billing:**
1. `GET /admin/billing/transactions` - All transactions
2. `GET /admin/billing/transactions/:id` - Transaction details
3. `GET /admin/billing/info` - All billing info records
4. `GET /admin/billing/info/:id` - Billing info details

**Frontend:**
1. Subscriptions table page with status badges
2. Extend trial dialog
3. Transactions table page
4. Billing info table page

**Deliverable:** Complete billing and subscription management

---

### Phase 6: Security & Support Tools

**Backend - Sessions:**
1. `GET /admin/sessions` - All active sessions
2. `GET /admin/sessions/user/:userId` - Sessions for specific user
3. `DELETE /admin/sessions/:id` - Revoke specific session
4. `DELETE /admin/sessions/user/:userId` - Force logout user
5. `POST /admin/sessions/cleanup` - Clean expired tokens

**Backend - Widgets:**
1. `GET /admin/widgets` - All widget configs overview
2. `GET /admin/widgets/:siteId` - Widget config for debugging

**Backend - Audit (Future):**
1. `GET /admin/audit` - Admin action history

**Frontend:**
1. Sessions table page (security dashboard)
2. Force logout buttons
3. Session security alerts
4. Widgets overview page
5. Admin settings page (placeholder for future)

**Deliverable:** Security monitoring and support tools

---

### Implementation Timeline Summary

| Phase | Focus | Backend Routes | Frontend Pages |
|-------|-------|----------------|----------------|
| 1 | Foundation | 8 stats endpoints | Dashboard |
| 2 | Users & Sites | 10 endpoints | 4 pages |
| 3 | Content Ops | 14 endpoints | 3 pages |
| 4 | Conversations | 5 endpoints | 3 pages |
| 5 | Billing | 6 endpoints | 3 pages |
| 6 | Security | 7 endpoints | 2 pages |
| **Total** | | **~50 endpoints** | **~15 pages** |

---

## 8. Entity Linking & Navigation

All related entity IDs displayed in tables should be clickable links to their detail pages. This improves admin workflow by allowing quick navigation between related data.

### Linking Matrix

| Source Table | Field | Links To | Example |
|--------------|-------|----------|---------|
| **Sites** | User Name/ID | `/admin/users/[userId]` | "John Doe" → User detail |
| **URLs** | Site Name | `/admin/sites/[siteId]` | "example.com" → Site detail |
| **Embeddings** | URL | `/admin/urls/[urlId]` | URL path → URL detail |
| **Embeddings** | Site Name | `/admin/sites/[siteId]` | Site → Site detail |
| **Files** | Site Name | `/admin/sites/[siteId]` | Site → Site detail |
| **Conversations** | Site Name | `/admin/sites/[siteId]` | Site → Site detail |
| **Messages** | Conversation ID | `/admin/conversations/[id]` | Convo → Conversation detail |
| **Subscriptions** | User Name | `/admin/users/[userId]` | User → User detail |
| **Subscriptions** | Site Name | `/admin/sites/[siteId]` | Site → Site detail |
| **Transactions** | User Name | `/admin/users/[userId]` | User → User detail |
| **Billing Info** | User Name | `/admin/users/[userId]` | User → User detail |
| **Sessions** | User Name | `/admin/users/[userId]` | User → User detail |
| **Widget Configs** | Site Name | `/admin/sites/[siteId]` | Site → Site detail |

### Implementation Pattern

```tsx
// Example: Clickable user link in any table
import Link from "next/link";

interface UserLinkProps {
  userId: string;
  userName: string;
}

export function UserLink({ userId, userName }: UserLinkProps) {
  return (
    <Link
      href={`/admin/users/${userId}`}
      className="text-primary hover:underline font-medium"
    >
      {userName}
    </Link>
  );
}

// Usage in table row
<TableCell>
  <UserLink userId={site.userId} userName={site.user.fullName} />
</TableCell>
```

### Reusable Link Components

Create these reusable link components in `components/admin/common/`:

| Component | Usage |
|-----------|-------|
| `UserLink` | Link to user detail from any table |
| `SiteLink` | Link to site detail from any table |
| `UrlLink` | Link to URL detail from any table |
| `ConversationLink` | Link to conversation detail |
| `SubscriptionLink` | Link to subscription detail |
| `TransactionLink` | Link to transaction detail |

### Breadcrumb Navigation

Each detail page should show breadcrumb navigation for context:

```
Dashboard > Users > John Doe
Dashboard > Sites > example.com > URLs > /about
Dashboard > Conversations > conv_abc123
```

### Back Links in Detail Pages

Detail pages should include "back" links and related entity links:

**User Detail Page:**
- Back to Users list
- Links to: All user's sites, All user's subscriptions, All user's sessions

**Site Detail Page:**
- Back to Sites list
- Links to: Owner user, All site URLs, All site conversations, All site files

**Conversation Detail Page:**
- Back to Conversations list
- Links to: Parent site, View all messages

### Quick Actions from Linked Data

When hovering over a linked entity, show a tooltip with quick info:

```tsx
// Example: User hover card
<HoverCard>
  <HoverCardTrigger>
    <UserLink userId={user.id} userName={user.fullName} />
  </HoverCardTrigger>
  <HoverCardContent>
    <p>{user.email}</p>
    <p>Joined: {formatDate(user.createdAt)}</p>
    <p>Sites: {user.sites.length}</p>
    <Button size="sm" variant="outline">View Details</Button>
  </HoverCardContent>
</HoverCard>
```

---

## 9. API Response Patterns - Include Relations

All admin API responses should include related entity objects (not just IDs) to enable proper linking and display in the frontend.

### Response Relation Requirements

| Endpoint | Must Include Relations |
|----------|----------------------|
| `GET /admin/users` | `sites[]`, `subscriptions[]`, `_count` |
| `GET /admin/users/:id` | `sites[]`, `subscriptions[]`, `billingInfo`, `billingHistory[]` |
| `GET /admin/sites` | `user`, `subscription`, `_count.urls`, `_count.conversations` |
| `GET /admin/sites/:id` | `user`, `urls[]`, `conversationStarters[]`, `conversations[]`, `knowledgeFiles[]`, `activeHosts[]`, `subscription`, `widgetSettings` |
| `GET /admin/urls` | `site.user`, `site.siteName`, `_count.embeddings` |
| `GET /admin/urls/:id` | `site`, `embeddings[]` |
| `GET /admin/embeddings` | `siteUrl.site`, `siteUrl.url` |
| `GET /admin/files` | `site.user`, `site.siteName` |
| `GET /admin/conversations` | `site.user`, `site.siteName`, `_count.messages` |
| `GET /admin/conversations/:id` | `site`, `messages[]` |
| `GET /admin/messages` | `conversation.site` |
| `GET /admin/subscriptions` | `user`, `site` |
| `GET /admin/billing/transactions` | `user` |
| `GET /admin/billing/info` | `user` |
| `GET /admin/sessions` | `user` (via userId lookup) |
| `GET /admin/widgets` | `site.user`, `site.siteName` |

### Prisma Include Pattern

```typescript
// Example: Sites list with relations
const sites = await prisma.site.findMany({
  include: {
    user: {
      select: { id: true, email: true, fullName: true }
    },
    subscription: {
      select: { id: true, status: true, planType: true }
    },
    _count: {
      select: { urls: true, conversations: true, knowledgeFiles: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit
});
```

### DTO Pattern with Relations

```typescript
// Example: SiteAdminDto with nested relations
interface SiteAdminDto {
  id: string;
  siteName: string;
  siteUrl: string;
  crawlStatus: CrawlStatus;
  createdAt: string;
  // Relations (not just IDs)
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
  subscription: {
    id: string;
    status: SubscriptionStatus;
    planType: PlanType;
  } | null;
  // Counts for display
  _count: {
    urls: number;
    conversations: number;
    knowledgeFiles: number;
  };
}
```

### Frontend Usage

```tsx
// The response includes user object, enabling direct linking
<TableRow>
  <TableCell>{site.siteName}</TableCell>
  <TableCell>
    <UserLink
      userId={site.user.id}
      userName={site.user.fullName || site.user.email}
    />
  </TableCell>
  <TableCell>{site._count.urls} URLs</TableCell>
</TableRow>
```

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Admin impersonation | Strict JWT validation + admin role check |
| Privilege escalation | Cannot modify own admin status via API |
| Data exposure | Audit logging for all admin actions |
| Rate abuse | Separate rate limits for admin endpoints |
| Session hijacking | Short-lived tokens, secure cookies |

### Recommended Security Measures

1. **Audit Logging**: Log all admin actions with timestamp, admin user, action type, affected resource
2. **IP Allowlisting** (optional): Restrict admin access to specific IPs
3. **2FA** (future): Require two-factor authentication for admin users
4. **Action Confirmation**: Require re-authentication for destructive actions

---

## 11. File Structure Proposal

### Backend - Complete Structure

```
backend/src/
├── routes/
│   ├── admin/
│   │   ├── index.ts               # Admin router aggregator + requireAdmin middleware
│   │   ├── stats.ts               # Dashboard statistics (all metrics endpoints)
│   │   ├── users.ts               # User CRUD + force-logout
│   │   ├── sites.ts               # Site CRUD + recrawl trigger
│   │   ├── urls.ts                # URL management + reprocess
│   │   ├── embeddings.ts          # Embedding monitoring + orphan detection
│   │   ├── files.ts               # Knowledge file management
│   │   ├── conversations.ts       # Conversation monitoring
│   │   ├── messages.ts            # Message search
│   │   ├── subscriptions.ts       # Subscription management
│   │   ├── billing.ts             # Transactions + billing info
│   │   ├── widgets.ts             # Widget config debugging
│   │   ├── sessions.ts            # RefreshToken/session management
│   │   └── audit.ts               # Audit log viewing (future)
│   └── ... (existing routes)
│
├── services/
│   └── admin/
│       ├── AdminStatsService.ts       # Aggregated statistics
│       ├── AdminUserService.ts        # User operations
│       ├── AdminSiteService.ts        # Site operations
│       ├── AdminUrlService.ts         # URL operations
│       ├── AdminEmbeddingService.ts   # Embedding operations
│       ├── AdminFileService.ts        # File operations
│       ├── AdminConversationService.ts
│       ├── AdminMessageService.ts
│       ├── AdminSubscriptionService.ts
│       ├── AdminBillingService.ts
│       ├── AdminWidgetService.ts
│       ├── AdminSessionService.ts     # Token/session management
│       └── AdminAuditService.ts       # Audit logging
│
├── middleware/
│   ├── adminAuth.ts               # requireAdmin middleware
│   └── adminAudit.ts              # Audit logging for admin actions
│
├── schemas/
│   └── admin/
│       ├── users.schema.ts
│       ├── sites.schema.ts
│       ├── urls.schema.ts
│       ├── embeddings.schema.ts
│       ├── files.schema.ts
│       ├── conversations.schema.ts
│       ├── subscriptions.schema.ts
│       ├── billing.schema.ts
│       └── sessions.schema.ts
│
└── dto/
    └── admin/
        ├── stats.dto.ts           # Dashboard statistics DTOs
        ├── users.dto.ts
        ├── sites.dto.ts
        ├── urls.dto.ts
        ├── embeddings.dto.ts
        ├── files.dto.ts
        ├── conversations.dto.ts
        ├── subscriptions.dto.ts
        ├── billing.dto.ts
        └── sessions.dto.ts
```

### Frontend - Complete Structure

```
frontend/
├── app/
│   └── admin/
│       ├── layout.tsx                     # Admin layout with sidebar
│       ├── page.tsx                       # Dashboard with all metrics
│       │
│       ├── users/
│       │   ├── page.tsx                   # Users table
│       │   └── [userId]/
│       │       └── page.tsx               # User detail (tabs: profile, sites, subscriptions, billing, sessions)
│       │
│       ├── sites/
│       │   ├── page.tsx                   # Sites table
│       │   └── [siteId]/
│       │       └── page.tsx               # Site detail (tabs: overview, urls, files, conversations, widget, starters, hosts)
│       │
│       ├── urls/
│       │   └── page.tsx                   # All URLs table
│       │
│       ├── embeddings/
│       │   └── page.tsx                   # Embeddings table + orphan detection
│       │
│       ├── files/
│       │   └── page.tsx                   # Knowledge files table (filter by status)
│       │
│       ├── conversations/
│       │   ├── page.tsx                   # Conversations table
│       │   └── [conversationId]/
│       │       └── page.tsx               # Conversation detail with messages
│       │
│       ├── messages/
│       │   └── page.tsx                   # Message search page
│       │
│       ├── subscriptions/
│       │   └── page.tsx                   # Subscriptions table
│       │
│       ├── billing/
│       │   ├── transactions/
│       │   │   └── page.tsx               # Transactions table
│       │   └── info/
│       │       └── page.tsx               # Billing info table
│       │
│       ├── widgets/
│       │   └── page.tsx                   # Widget configs overview
│       │
│       ├── sessions/
│       │   └── page.tsx                   # Active sessions / security
│       │
│       └── settings/
│           └── page.tsx                   # Admin settings (future)
│
├── components/
│   └── admin/
│       ├── layout/
│       │   ├── admin-layout.tsx           # Main layout wrapper
│       │   ├── admin-sidebar.tsx          # Navigation sidebar
│       │   ├── admin-header.tsx           # Top header with user menu
│       │   └── admin-breadcrumb.tsx       # Breadcrumb navigation
│       │
│       ├── dashboard/
│       │   ├── stats-card.tsx             # Individual stat card
│       │   ├── stats-grid.tsx             # Grid layout for stats
│       │   ├── trend-indicator.tsx        # Up/down trend arrow
│       │   ├── mini-chart.tsx             # Small sparkline chart
│       │   └── alert-card.tsx             # Attention-needed alerts
│       │
│       ├── tables/
│       │   ├── data-table.tsx             # Generic sortable/filterable table
│       │   ├── table-pagination.tsx       # Pagination controls
│       │   ├── table-filters.tsx          # Filter dropdowns
│       │   ├── table-search.tsx           # Search input
│       │   └── table-actions.tsx          # Row action buttons
│       │
│       ├── users/
│       │   ├── user-table-row.tsx
│       │   ├── user-detail-tabs.tsx
│       │   └── user-edit-dialog.tsx
│       │
│       ├── sites/
│       │   ├── site-table-row.tsx
│       │   ├── site-detail-tabs.tsx
│       │   └── site-actions-menu.tsx
│       │
│       ├── embeddings/
│       │   ├── embedding-table-row.tsx
│       │   ├── orphan-urls-list.tsx
│       │   └── embedding-stats-card.tsx
│       │
│       ├── files/
│       │   ├── file-table-row.tsx
│       │   ├── file-status-badge.tsx
│       │   └── file-reprocess-button.tsx
│       │
│       ├── conversations/
│       │   ├── conversation-table-row.tsx
│       │   ├── conversation-detail.tsx
│       │   └── message-thread.tsx
│       │
│       ├── subscriptions/
│       │   ├── subscription-table-row.tsx
│       │   ├── subscription-status-badge.tsx
│       │   └── extend-trial-dialog.tsx
│       │
│       ├── sessions/
│       │   ├── session-table-row.tsx
│       │   ├── force-logout-button.tsx
│       │   └── session-security-alert.tsx
│       │
│       └── common/
│           ├── entity-links/
│           │   ├── user-link.tsx          # Clickable user name → user detail
│           │   ├── site-link.tsx          # Clickable site name → site detail
│           │   ├── url-link.tsx           # Clickable URL → URL detail
│           │   ├── conversation-link.tsx  # Clickable convo → conversation detail
│           │   ├── subscription-link.tsx  # Clickable sub → subscription detail
│           │   └── transaction-link.tsx   # Clickable txn → transaction detail
│           ├── date-range-picker.tsx      # Filter by date range
│           ├── export-button.tsx          # CSV/JSON export
│           ├── bulk-actions.tsx           # Multi-select actions
│           └── confirm-action-dialog.tsx  # Generic confirmation
│
└── lib/
    ├── hooks/
    │   ├── useRequireAdmin.ts             # Admin route protection
    │   └── useAdminStats.ts               # Dashboard stats hook
    │
    └── api/
        └── generated/
            └── queries/
                └── admin/                 # Auto-generated admin API hooks
                    ├── stats.ts
                    ├── users.ts
                    ├── sites.ts
                    ├── urls.ts
                    ├── embeddings.ts
                    ├── files.ts
                    ├── conversations.ts
                    ├── messages.ts
                    ├── subscriptions.ts
                    ├── billing.ts
                    ├── widgets.ts
                    └── sessions.ts
```

---

## 12. Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Separate admin routes | Yes (`/api/v1/admin/*`) | Security isolation, clear permissions |
| Separate Swagger | No (single with Admin tag) | Simpler maintenance |
| Role system | Simple `isAdmin` boolean | Sufficient for current needs, can evolve later |
| Entity coverage | All 14 models | Complete visibility for admins |
| Embedding visibility | Dedicated page | Critical for debugging vector search issues |
| KnowledgeFile visibility | Dedicated page | Monitor file processing across all sites |
| RefreshToken visibility | Sessions page | Security auditing and force-logout capability |
| New components | ~30 admin-specific | Mostly table/dashboard variants |
| Implementation approach | 6 phases | Reduce risk, deliver incrementally |

### Pages Summary

| Category | Pages | Priority |
|----------|-------|----------|
| Core Management | Dashboard, Users, Sites, Subscriptions | Phase 1-2 |
| Content Operations | URLs, Embeddings, Files | Phase 3 |
| Communication | Conversations, Messages | Phase 4 |
| Billing | Transactions, Billing Info | Phase 5 |
| Security & Support | Sessions, Widgets, Settings | Phase 6 |
| **Total** | **14 pages** | |

---

## 13. Open Questions

Before implementation, clarify:

1. **First admin user**: How will the initial admin be created? (Database seed? CLI command?)
2. **Admin creation**: Can admins create other admins? Or only via database?
3. **Soft vs hard delete**: Should admin deletions be reversible?
4. **Data export**: Is CSV/JSON export required for tables?
5. **Real-time updates**: Should admin dashboard show live statistics via WebSocket?
6. **Mobile support**: Is the admin portal required on mobile devices?

---

## 14. Appendix: Existing Component Reference

### Data Table Pattern (from sitemap-tab.tsx)

The existing codebase uses this pattern for tables:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
      ...
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.field}</TableCell>
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Form Pattern (from preferences-tab.tsx)

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

<Form {...form}>
  <FormInput
    name="fieldName"
    label="Field Label"
    control={form.control}
  />
</Form>
```

### Protected Route Pattern

```tsx
export default function AdminPage() {
  const { isLoading } = useRequireAdmin(); // New hook needed

  if (isLoading) return <LoadingSpinner />;

  return <AdminContent />;
}
```
