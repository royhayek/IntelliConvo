# Crawler Optimization: Phased Crawling with User Control

## Overview

This document tracks the implementation of an optimized crawling system that gives users control over URL selection and provides predictable, transparent crawl times.

## Problem Statement

Current issues with the crawler:
- **Long wait times** - Sequential crawling + embedding, 2 concurrent jobs globally
- **Infinite crawling feel** - No upfront URL preview, recursive discovery with no clear end
- **Incomplete coverage** - Sites without sitemaps use discovery which may miss pages
- **100 URL hard limit** - Hardcoded `maxPages: 100`
- **No user control upfront** - Crawl starts immediately on site creation
- **Poor progress visibility** - Only shows URL count, no ETA or phase indicators

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEW CRAWLING FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. DISCOVERY PHASE (Fast, 30-60 seconds)                          │
│     ├─ Fetch sitemap.xml → Extract URLs (don't crawl content)      │
│     ├─ If no sitemap → Quick homepage crawl + link extraction      │
│     └─ Return URL list with estimates                              │
│                                                                     │
│  2. URL SELECTION PHASE (User Control)                             │
│     ├─ Show discovered URLs with smart categorization              │
│     ├─ Pre-select important pages (homepage, about, products)      │
│     ├─ Allow manual URL additions                                  │
│     ├─ Show time/cost estimates based on selection                 │
│     └─ User confirms selection → Proceed                           │
│                                                                     │
│  3. CRAWLING PHASE (Optimized)                                     │
│     ├─ Crawl ONLY selected URLs (no recursive discovery)           │
│     ├─ Show real progress: "5/23 pages crawled (~3 min left)"      │
│     └─ Allow pause/resume                                          │
│                                                                     │
│  4. EMBEDDING PHASE (After Payment)                                │
│     ├─ Parallel embedding with batching                            │
│     └─ Progressive availability                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: URL Discovery Service (Critical) ✅ COMPLETE

**Goal:** Fast URL enumeration without content crawling

#### Tasks

- [x] Create `UrlDiscoveryService` with fast sitemap parsing
- [x] Add discovery database schema (`DiscoveryStatus`, `UrlSelection` model)
- [x] Create discovery API endpoints
- [x] Update onboarding flow to include URL selection step
- [x] Implement selective crawl mode in crawler
- [x] Add frontend URL selection component

#### Files Created/Modified

**Backend:**
- [x] `backend/src/services/discovery/UrlDiscoveryService.ts` (NEW)
- [x] `backend/src/routes/sites.ts` (MODIFIED - added discovery routes)
- [x] `backend/prisma/schema.prisma` (MODIFIED - added DiscoveryStatus, UrlSelection)
- [x] `backend/src/services/crawler.ts` (MODIFIED - added crawlSelectiveUrls)
- [x] `backend/src/queues/index.ts` (MODIFIED - added queueSelectiveCrawl)
- [x] `backend/src/schemas/sites.schema.ts` (MODIFIED - added discovery schemas)

**Frontend:**
- [x] `frontend/app/onboarding/components/UrlSelectionStep.tsx` (NEW)
- [x] `frontend/app/onboarding/components/types.ts` (MODIFIED - new step flow)
- [x] `frontend/app/onboarding/page.tsx` (MODIFIED - integrated URL selection)
- [x] `frontend/lib/hooks/useSiteSocket.ts` (MODIFIED - discovery status updates)

#### Schema Changes

```prisma
enum DiscoveryStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

model UrlSelection {
  id          String   @id @default(uuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  url         String
  source      String   // 'sitemap' | 'discovery' | 'manual'
  category    String   // 'homepage' | 'product' | 'blog' | 'about' | 'support' | 'other'
  selected    Boolean  @default(false)
  priority    String   // 'high' | 'medium' | 'low'
  createdAt   DateTime @default(now())

  @@unique([siteId, url])
  @@index([siteId])
}
```

#### API Endpoints

```
POST /api/v1/sites/:siteId/discover     - Start URL discovery
GET  /api/v1/sites/:siteId/discovery    - Get discovery results
POST /api/v1/sites/:siteId/selections   - Save URL selections
PUT  /api/v1/sites/:siteId/selections   - Update selections
POST /api/v1/sites/:siteId/crawl        - Start selective crawl
```

---

### Phase 2: Progress & Estimates (Important) ✅ COMPLETE

**Goal:** Real-time progress with accurate time estimates

#### Tasks

- [x] Add crawl progress tracking with ETA calculation
- [x] Implement URL categorization algorithm
- [x] Add manual URL input with validation
- [x] Implement plan-based URL limits
- [x] Create progress UI component with phases

#### Progress Data Structure

```typescript
interface CrawlProgress {
  phase: 'discovery' | 'crawling' | 'embedding';
  completed: number;
  total: number;
  currentUrl: string;
  estimatedSecondsRemaining: number;
  errors: number;
  startedAt: Date;
}
```

#### Files Created/Modified

**Backend:**
- [x] `backend/src/config/planLimits.ts` (NEW) - Plan-based URL limits configuration
- [x] `backend/src/services/discovery/UrlDiscoveryService.ts` (MODIFIED) - Added plan limits enforcement
- [x] `backend/src/routes/sites.ts` (MODIFIED) - Added plan limits to selective crawl endpoint

**Frontend:**
- [x] `frontend/app/onboarding/components/AnalyzingStep.tsx` (MODIFIED) - Enhanced with ETA, phases, progress bar
- [x] `frontend/app/onboarding/components/UrlSelectionStep.tsx` (MODIFIED) - Added plan limits display and warnings
- [x] `frontend/app/onboarding/page.tsx` (MODIFIED) - Pass full progress data to components

#### Plan Limits (Configurable via Admin Settings)

All limits are now configurable through System Settings in the admin panel:

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `billing.maxUrlsPerSite` | 500 | Maximum URLs that can be crawled per site |
| `billing.trialEnabled` | false | Enable/disable trial feature |
| `billing.trialDays` | 1 | Trial duration in days |
| `billing.trialMaxConversations` | 5 | Max conversations during trial |
| `billing.trialMaxMessages` | 20 | Max messages during trial |

**Key Design Decision:** Payment is required for embeddings, not crawling. This means:
- All users can discover and crawl URLs (content extraction is cheap)
- Trial/unpaid sites won't generate embeddings, so the widget won't work
- Trial limits apply to conversations/messages once embeddings are generated

#### Trial System (Hybrid: Time + Usage)

When trial is enabled (`billing.trialEnabled = true`):
1. **Time-based:** Trial expires after X days
2. **Conversation-based:** Trial expires after X conversations
3. **Message-based:** Trial expires after X messages
4. **Whichever limit is hit first ends the trial**

Files modified for trial system:
- `backend/src/lib/settings.ts` - Added trial setting keys and helpers
- `backend/src/config/planLimits.ts` - Added `checkTrialStatus()` function
- `backend/src/services/socket.ts` - Added trial limit checking before messages

---

### Phase 3: Optimization & Polish (Enhancement) - IN PROGRESS

**Goal:** Performance improvements and additional features

#### Tasks

- [x] Parallel embedding optimization (batch OpenAI calls)
- [x] Progressive availability (first URLs ready while rest processes)
- [x] Crawl pause/resume functionality
- [x] "Add more URLs later" feature in dashboard (already exists)
- [x] Smart retry for failed URLs
- [x] Caching for repeated discoveries

#### 2024-11-24 - Parallel Embedding Optimization Complete

**Backend Changes:**
- Added `generateBatchEmbeddings()` function in `embeddings.ts`:
  - Batches OpenAI API calls (100 chunks per request instead of 1)
  - Batches Pinecone upserts (100 vectors per batch)
  - Uses `prisma.createMany()` for bulk DB inserts
- Added `processSiteEmbeddingsParallel()` function:
  - Processes 5 URLs concurrently using `p-limit`
  - Real-time progress tracking with ETA calculation
  - Returns success/fail counts and failed URL IDs
- Updated embedding worker in `queues/index.ts`:
  - Uses new parallel processing function
  - Emits `embedding-progress` socket events
  - Bulk updates URL statuses after completion

**Frontend Changes:**
- Added `EmbeddingProgressUpdate` interface to `useSiteSocket.ts`
- Added `onEmbeddingProgress` callback to socket hook
- Updated `AnalyzingStep.tsx`:
  - Phase indicator now shows active embedding phase
  - Progress bar text changes based on phase
  - Supports PROCESSING status for embedding phase

**Performance Improvement:**
- Before: Sequential processing (1 chunk = 1 API call, 1 URL at a time)
- After: Batch processing (100 chunks = 1 API call, 5 URLs in parallel)
- Estimated 10-20x speedup for embedding generation

#### 2024-11-24 - Progressive Availability Complete

**Goal:** Widget becomes usable as soon as the first URLs are embedded, rather than waiting for all URLs to complete.

**Backend Changes:**
- Updated `searchContent()` in `embeddings.ts`:
  - Now filters URLs by `embeddingStatus: 'READY'`
  - Returns empty results if no URLs are ready yet
  - Chat works with partial content as it becomes available

- Updated `processSiteEmbeddingsParallel()`:
  - Added `UrlCompletionCallbacks` interface for real-time notifications
  - `onUrlSuccess` and `onUrlFailure` callbacks for per-URL status updates

- Updated embedding worker in `queues/index.ts`:
  - URL status updated to READY immediately after each embedding completes (not bulk at end)
  - Socket events emitted per-URL for real-time UI updates

- Updated `getPublicSettings()` in `WidgetService.ts`:
  - Returns `readiness` object: `{ ready: number, total: number, isPartiallyReady: boolean }`
  - Widget can display "X of Y pages ready" during processing

**How It Works:**
1. User starts embedding generation after payment
2. As each URL's embedding completes:
   - Database updated immediately to `READY`
   - Socket event emitted to connected clients
   - URL becomes searchable via Pinecone
3. Chat queries now only search `READY` URLs
4. Widget works progressively as more content becomes available

**Key Benefits:**
- Users can start chatting within seconds of first URL completing
- No need to wait for entire embedding job to finish
- Real-time progress visible in UI
- Graceful degradation if some URLs fail

#### 2024-11-24 - Crawl Pause/Resume Complete

**Goal:** Allow users to pause a crawl in progress and resume it later.

**Database Changes:**
- Added `PAUSED` status to `CrawlStatus` enum in Prisma schema

**Backend Changes:**
- Added pause flag methods to `CacheService`:
  - `setCrawlPaused(siteId, paused)`: Set/clear Redis pause flag
  - `isCrawlPaused(siteId)`: Check if crawl is paused
- Added `shouldAbortCrawl()` and `clearAbortFlag()` in `crawler.ts`:
  - Checks pause flag before processing each URL
  - Aborts crawler gracefully when paused
- Added `shouldAbort` callback to `UrlCompletionCallbacks`:
  - Embedding worker checks pause flag between URLs
- Added API endpoints in `routes/sites.ts`:
  - `POST /api/v1/sites/:siteId/crawl/pause`: Pause crawl
  - `POST /api/v1/sites/:siteId/crawl/resume`: Resume crawl

**Frontend Changes:**
- Added `PAUSED` to `CrawlStatusUpdate` type in `useSiteSocket.ts`
- Added `PAUSED` to `Site` type in `types.ts`
- Updated `AnalyzingStep.tsx`:
  - Added `onPause` and `onResume` props
  - Added pause button in analyzing state
  - Added paused state UI with resume button

**How It Works:**
1. User clicks "Pause" button during crawl/embedding
2. Backend sets Redis flag: `cache:crawl:paused:${siteId}`
3. Site status updated to `PAUSED`
4. Crawler/Embedding worker checks flag before each URL
5. Worker aborts gracefully, preserving completed work
6. User clicks "Resume" to clear flag and re-queue remaining work

**API Usage:**
```bash
# Pause a crawl
curl -X POST /api/v1/sites/:siteId/crawl/pause -H "Authorization: Bearer ..."

# Resume a paused crawl
curl -X POST /api/v1/sites/:siteId/crawl/resume -H "Authorization: Bearer ..."
```

#### 2024-11-24 - "Add More URLs Later" Feature (Already Exists)

**Goal:** Allow users to add additional URLs to an existing site after initial setup.

**Existing Implementation:**

This feature was already implemented in the original URL management system:

**Backend:**
- `POST /api/v1/sites/:siteId/urls` - Add URLs to existing site
  - Uses `urlService.addUrls()` in `backend/src/services/url/UrlService.ts`
  - Creates `SiteUrl` records with `embeddingStatus: SCRAPING`
  - Automatically queues crawl job for each new URL via `queueCrawl(siteId, 'single', url)`
  - Skips duplicate URLs

**Frontend:**
- SitemapTab (`frontend/components/site/sitemap-tab.tsx`) has full UI:
  - "Add URL" button opens modal dialog
  - Single URL mode with validation
  - Bulk mode (paste multiple URLs, one per line)
  - Uses `usePostSitesSiteIdUrls` hook
  - Real-time URL status updates via socket

**API Usage:**
```bash
# Add URLs to existing site
curl -X POST /api/v1/sites/:siteId/urls \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/new-page", "https://example.com/another-page"]}'
```

**How It Works:**
1. User navigates to Site → Sitemap tab
2. Clicks "Add URL" button
3. Enters URL(s) in single or bulk mode
4. Backend creates `SiteUrl` records
5. Crawl jobs queued automatically for new URLs
6. Real-time status updates via socket as URLs are processed

#### 2024-11-24 - Smart Retry for Failed URLs Complete

**Goal:** Allow retrying failed URL embeddings with error tracking and limits.

**Database Changes:**
- Added fields to `SiteUrl` model:
  - `retryCount`: Number of retry attempts (default: 0)
  - `lastError`: Error message from last failure
  - `lastRetryAt`: Timestamp of last retry attempt

**Backend Changes:**
- Updated `onUrlFailure` callback in embedding worker (`queues/index.ts`):
  - Stores error message (truncated to 1000 chars)
  - Increments retry count
  - Records retry timestamp

- Added retry methods to `UrlService` (`services/url/UrlService.ts`):
  - `getFailedUrls(siteId, userId)`: Get failed URLs with error details
  - `retryFailedUrls(siteId, userId, maxRetries)`: Retry all failed URLs (skips URLs exceeding max retries)
  - `retryUrl(siteId, urlId, userId)`: Retry a single URL

- Added API endpoints in `routes/urls.ts`:
  - `GET /api/v1/sites/:siteId/urls/failed`: Get failed URLs with error info
  - `POST /api/v1/sites/:siteId/urls/retry-failed`: Retry all failed URLs
  - `POST /api/v1/sites/:siteId/urls/:urlId/retry`: Retry single URL

**Retry Logic:**
1. URLs with content → Reset to SCRAPED status → Queue embedding job
2. URLs without content → Queue crawl job
3. URLs exceeding `maxRetries` (default: 3) are skipped
4. Error messages preserved for debugging

**API Usage:**
```bash
# Get failed URLs
curl -X GET /api/v1/sites/:siteId/urls/failed -H "Authorization: Bearer ..."

# Response:
{
  "urls": [
    { "id": "...", "url": "https://...", "lastError": "Rate limit exceeded", "retryCount": 2, "lastRetryAt": "2024-..." }
  ],
  "totalFailed": 1
}

# Retry all failed URLs
curl -X POST /api/v1/sites/:siteId/urls/retry-failed -H "Authorization: Bearer ..."

# Response:
{ "message": "Queued 5 URLs for retry", "retriedCount": 5, "skippedCount": 1 }

# Retry single URL
curl -X POST /api/v1/sites/:siteId/urls/:urlId/retry -H "Authorization: Bearer ..."
```

#### 2024-11-24 - Caching for Repeated Discoveries Complete

**Goal:** Cache discovery results to speed up repeated URL enumeration for the same site.

**Backend Changes:**
- Added `DISCOVERY` namespace to `CacheNamespace` in `cache.ts`
- Modified `discoverUrls()` function in `UrlDiscoveryService.ts`:
  - Added `DiscoveryOptions` interface with `forceRefresh` parameter
  - Checks Redis cache before fetching sitemap/homepage
  - Stores results in cache after successful discovery
  - Cache TTL: 24 hours (sitemaps don't change often)
  - Cache includes warning when results are from cache
- Added `invalidateDiscoveryCache()` function to clear cache for a site
- Updated discovery route to accept `forceRefresh` query parameter

**How It Works:**
1. User triggers discovery via `POST /api/v1/sites/:siteId/discover`
2. System checks Redis cache for existing results
3. If cached (and not `forceRefresh`):
   - Returns cached URLs instantly (~0ms vs ~30s)
   - Adds warning: "Results loaded from cache. Use 'Refresh' to re-scan."
4. If not cached or `forceRefresh=true`:
   - Fetches sitemap/crawls homepage
   - Caches results for 24 hours
   - Returns fresh results

**API Usage:**
```bash
# Normal discovery (uses cache if available)
curl -X POST /api/v1/sites/:siteId/discover -H "Authorization: Bearer ..."

# Force refresh (bypasses cache)
curl -X POST /api/v1/sites/:siteId/discover?forceRefresh=true -H "Authorization: Bearer ..."
```

**Performance Improvement:**
- First discovery: ~30 seconds (fetching sitemap or crawling homepage)
- Subsequent discoveries: ~0ms (instant from cache)
- Cache expires after 24 hours for freshness

---

## URL Categorization Rules

| Pattern | Category | Priority |
|---------|----------|----------|
| `/`, `/home`, `/index` | homepage | high |
| `/about*`, `/contact*`, `/team*`, `/company*` | about | high |
| `/product*`, `/service*`, `/pricing*`, `/feature*` | product | high |
| `/faq*`, `/help*`, `/support*`, `/docs*` | support | high |
| `/blog/*`, `/news/*`, `/article*`, `/post*` | blog | medium |
| Everything else | other | low |

## Subscription Tier Limits

| Plan ID | Name | Price | Billing | Description |
|---------|------|-------|---------|-------------|
| `PREMIUM_MONTHLY` | Premium Monthly | $29/month | Monthly | Full access to all features |
| `PREMIUM_ANNUAL` | Premium Annual | $279/year | Yearly | Full access + 2 months free (save ~20%) |

---

## Progress Log

### 2024-11-24 - Phase 1 Implementation Complete

**Backend (100% Complete):**
- [x] Created `UrlDiscoveryService` with fast sitemap parsing and homepage discovery
- [x] Added `DiscoveryStatus` enum and `UrlSelection` model to Prisma schema
- [x] Created discovery API routes (discover, get results, stats, selections, bulk-select, manual-urls)
- [x] Added `queueSelectiveCrawl` function to queues
- [x] Created `crawlSelectiveUrls` function in crawler.ts with ETA progress
- [x] Backend compiles without errors

**Frontend (100% Complete):**
- [x] Created `UrlSelectionStep` component with category grouping and bulk selection
- [x] Updated `types.ts` with new step flow (site-url → select-urls → crawling → plan → complete)
- [x] Exported new component from index.ts
- [x] Integrated into page.tsx - Wired up API calls and step navigation

**API Endpoints Ready:**
```
POST /api/v1/sites/:siteId/discover        - Start URL discovery
GET  /api/v1/sites/:siteId/discovery       - Get discovery results
GET  /api/v1/sites/:siteId/discovery/stats - Get category statistics
PUT  /api/v1/sites/:siteId/discovery/selections - Update URL selections
POST /api/v1/sites/:siteId/discovery/bulk-select - Bulk select/deselect
POST /api/v1/sites/:siteId/discovery/manual-urls - Add manual URLs
POST /api/v1/sites/:siteId/crawl/selective - Start selective crawl
```

**Phase 1 Complete!** All major functionality implemented:

1. ✅ Fast URL discovery (sitemap parsing + homepage link extraction)
2. ✅ URL categorization and smart pre-selection
3. ✅ Frontend URL selection UI with category grouping
4. ✅ Selective crawl mode (only crawls selected URLs)
5. ✅ Real-time progress with ETA
6. ✅ Socket events for discovery status updates

**Enhancements Completed in Phase 2:**
- ✅ Add progress bars with time estimates in UI
- ✅ Add URL limit enforcement based on subscription tier
- [ ] Regenerate frontend API client for typed hooks (`npm run generate:api`) - Optional
- [ ] Implement crawl pause/resume - Moved to Phase 3

### 2024-11-24 - Phase 2 Implementation Complete

**Progress & Estimates Implementation:**

1. ✅ Enhanced AnalyzingStep component with:
   - Visual phase indicator (Crawling → Embedding)
   - Progress bar with percentage and ETA
   - Current URL display
   - Shimmer animation effect

2. ✅ Plan-based URL limits:
   - Created `backend/src/config/planLimits.ts` with tier configuration
   - Trial users: 25 URLs max, 100 discovery limit
   - Premium subscribers: 500 URLs max, 2000 discovery limit
   - Enforced limits in discovery and selective crawl endpoints

3. ✅ Frontend limit display:
   - Shows max URLs for plan in selection summary
   - Warning banner when selection exceeds plan limit
   - Clear messaging about what will be crawled

### 2024-11-24 - Trial System Implementation

**Configurable Trial Limits:**

1. ✅ Added new system settings for trial:
   - `billing.trialEnabled` (boolean, default: false)
   - `billing.trialDays` (number, default: 1)
   - `billing.trialMaxConversations` (number, default: 5)
   - `billing.trialMaxMessages` (number, default: 20)
   - `billing.maxUrlsPerSite` (number, default: 500)

2. ✅ Updated `planLimits.ts`:
   - Now reads limits from system settings instead of hardcoded values
   - Added `checkTrialStatus()` function for hybrid trial checking
   - All users get same URL limits (payment gate is on embeddings)

3. ✅ Added trial checking to socket messages:
   - Checks trial status before processing chat messages
   - Emits `trial-expired` event with details
   - Returns error message prompting upgrade

**Key Design Decisions:**
- Trial is disabled by default (admin must enable)
- Hybrid trial: Time OR conversations OR messages (whichever hits first)
- URL limits apply to all users equally (payment required for embeddings)

---

## Testing Checklist

### Phase 1 Testing
- [ ] Site with valid sitemap.xml
- [ ] Site with sitemap index (multiple sitemaps)
- [ ] Site without sitemap (discovery mode)
- [ ] Site with 1000+ URLs in sitemap
- [ ] Manual URL addition
- [ ] URL validation (invalid URLs, external domains)
- [ ] Selection persistence
- [ ] Selective crawl only crawls selected URLs

### Edge Cases
- [ ] Sitemap returns 404
- [ ] Sitemap is malformed XML
- [ ] Site blocks crawler (403/401)
- [ ] Site has JavaScript-only navigation
- [ ] Site redirects to different domain
- [ ] Duplicate URLs in sitemap
