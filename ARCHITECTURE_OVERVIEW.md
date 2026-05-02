# IntelliConvo - Architecture & System Design Overview

**Date**: December 29, 2025  
**Version**: 1.0.1

---

## System Architecture Diagram

```
                        ┌─────────────────────────────────┐
                        │      Internet / CDN              │
                        └──────────────┬──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼────┐      ┌─────▼────┐      ┌─────▼────┐
              │  Widget   │      │ Frontend │      │   API    │
              │  (CDN)    │      │ (3000)   │      │ (5001)   │
              └─────┬────┘      └─────┬────┘      └─────┬────┘
                    │                 │                  │
                    └─────────────────┼──────────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │   Backend API Server   │
                          │  (Node.js + Express)   │
                          │                        │
                          ├─ Auth Service          │
                          ├─ Chat Service          │
                          ├─ Crawler Service       │
                          ├─ Embedding Service     │
                          ├─ Subscription Service  │
                          ├─ Socket.IO (Real-time) │
                          └─────────┬──────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
        ┌───────▼────────┐  ┌──────▼──────┐   ┌───────▼────────┐
        │   PostgreSQL   │  │    Redis    │   │  External APIs │
        │   (Database)   │  │   (Cache)   │   │                │
        └────────────────┘  └─────────────┘   ├─ OpenAI        │
                                              ├─ Pinecone      │
                                              ├─ Stripe        │
                                              └─ Resend Email  │
```

---

## Backend Service Architecture

### Service-Oriented Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                            │
├─────────────────────────────────────────────────────────────┤
│  Request Pipeline:                                           │
│  1. Security Middleware (Helmet, Rate Limiting)             │
│  2. Authentication (Passport, JWT)                          │
│  3. Request Validation (Zod Schemas)                        │
│  4. Route Handler (delegates to service)                    │
│  5. Error Handler (custom errors → HTTP response)           │
└─────────────────────────────────────────────────────────────┘

        ├─ Auth Routes               ├─ Socket.IO
        │  ├─ POST /auth/signup      │  └─ Real-time events
        │  ├─ POST /auth/login       │
        │  └─ POST /auth/refresh     │
        │                            │
        ├─ Site Routes              ├─ Queue Service
        │  ├─ POST /sites           │  ├─ Crawling jobs
        │  ├─ GET /sites/:id        │  ├─ Embedding jobs
        │  └─ PATCH /sites/:id      │  └─ Email jobs
        │                            │
        ├─ Chat Routes             ├─ External Services
        │  ├─ POST /conversations  │  ├─ OpenAI API
        │  ├─ GET /conversations   │  ├─ Pinecone API
        │  └─ WS /socket.io        │  ├─ Stripe API
        │                          │  └─ Resend Email API
        └─ Billing Routes
           ├─ GET /billing/history
           ├─ POST /webhooks
           └─ GET /billing/summary
```

---

## Database Schema (Simplified)

```
User (Auth)
  ├─ id, email, passwordHash
  ├─ authProvider (GOOGLE, GITHUB, EMAIL, MICROSOFT)
  ├─ isAdmin, emailVerified
  └─ createdAt, lastLoginAt

  ▶─ Sites (1:many)
     ├─ id, userId, siteUrl, siteName
     ├─ crawlStatus (PENDING → CRAWLING → COMPLETED)
     └─ createdAt, lastCrawledAt

     ▶─ SiteUrls (1:many)
        ├─ id, siteId, url, title, content
        ├─ embeddingStatus (SCRAPED → READY)
        └─ retryCount, lastError

        ▶─ Embeddings (1:many)
           ├─ id, siteUrlId, content, contentChunk
           ├─ chunkIndex, vectorId (Pinecone)
           └─ createdAt

     ▶─ Conversations (1:many)
        ├─ id, siteId, sessionId, userIdentifier
        ├─ status (ACTIVE → NEEDS_AGENT → AGENT_ACTIVE → RESOLVED)
        ├─ assignedAgentId, escalatedAt, agentJoinedAt
        ├─ feedbackRating (1-5), feedbackComment
        └─ startedAt, lastMessageAt

        ▶─ Messages (1:many)
           ├─ id, conversationId, role (USER/ASSISTANT/AGENT)
           ├─ content, tokensUsed, costInCents
           └─ timestamp, agentId (if AGENT message)

     ▶─ WidgetSettings (1:1)
        ├─ 150+ customization fields
        ├─ Colors, fonts, layout, behavior
        └─ Human handoff settings

  ▶─ Subscriptions (1:many)
     ├─ id, userId, siteId
     ├─ planType (PREMIUM_MONTHLY/ANNUAL)
     ├─ status (TRIAL → ACTIVE → CANCELLED)
     ├─ stripeSubscriptionId
     └─ trialEndsAt, currentPeriodEnd

  ▶─ BillingInfo (1:1)
     ├─ userId, fullName, email
     ├─ address, city, country
     └─ stripeCustomerId

  ▶─ BillingTransaction (1:many)
     ├─ id, userId, siteId
     ├─ invoiceId, amount, status
     └─ stripeInvoiceId, createdAt
```

---

## Data Flow: Chat Message

```
User types message in Widget
        ↓
Widget emits 'send-message' via Socket.IO
        ↓
Backend receives socket event
        ↓
1. Retrieve conversation from database
2. Build context from recent messages
        ↓
3. Semantic search on knowledge base
   - Convert message to embedding (OpenAI)
   - Query Pinecone for similar content
   - Retrieve top-k relevant chunks
        ↓
4. Create prompt:
   System: "You are a helpful assistant..."
   Context: "Here's relevant knowledge..."
   History: [user message 1, assistant response 1, ...]
   User: "Current message"
        ↓
5. Call OpenAI GPT-4 (streaming)
        ↓
6. Stream response back to widget in real-time
        ↓
7. Save message to database
   - User message
   - AI response
   - Token count & cost
        ↓
Widget displays message in real-time
```

---

## Data Flow: Website Crawling

```
User adds site "example.com"
        ↓
1. Discovery Phase
   - Fetch robots.txt, sitemap.xml
   - Parse and extract URLs
   - Create UrlSelection records (PENDING)
        ↓
2. User selects URLs to crawl
   - Marks UrlSelection as selected: true
        ↓
3. Crawl Job Queued (BullMQ)
        ↓
4. Worker process:
   For each selected URL:
     a. Crawl with Playwright
     b. Extract content with Mozilla Readability
     c. Store in SiteUrl.content
     d. Mark embeddingStatus: SCRAPED
        ↓
5. Embedding Job Queued
   For each SiteUrl:
     a. Chunk content (semantic boundaries)
     b. Generate embeddings (OpenAI)
     c. Create Embedding records
     d. Store vectors in Pinecone
     e. Mark embeddingStatus: READY
        ↓
Site ready for chat
(Messages now search against knowledge base)
```

---

## Authentication Flow

```
User clicks "Login with Google"
        ↓
1. Frontend redirects to backend OAuth URL
2. Backend initiates Google OAuth flow
3. User grants permission
4. Google redirects to /auth/callback with code
        ↓
5. Backend exchanges code for tokens
   - Calls Google API with code
   - Receives user info
        ↓
6. Check if user exists in database
   a. If exists: Use that user
   b. If not: Create new user
        ↓
7. Generate JWT tokens:
   - Access token (15 min expiry)
   - Refresh token (stored in DB)
        ↓
8. Return tokens to frontend
9. Frontend stores in localStorage
        ↓
10. Subsequent requests:
    - Include JWT in Authorization header
    - Verified by JWT middleware
    - User loaded from database
        ↓
11. Logout: Token added to blacklist (Redis)
    - All future requests rejected
    - Can force logout all sessions
```

---

## Subscription Lifecycle

```
User completes onboarding
        ↓
1. Trial created
   - status: TRIAL
   - trialEndsAt: now + 14 days (configurable)
        ↓
2. User can use full platform features
   (crawling, widget, chat, everything)
        ↓
3a. Trial expires
   - Stripe subscription created
   - First payment charged
   - Status: ACTIVE
        ↓
   3b. OR: User cancels
   - Status: CANCELLED
   - Can't crawl/chat after period ends
        ↓
4. Recurring subscription
   - Every 30 days (monthly) or 365 days (annual)
   - Stripe creates invoice
   - Webhook notifies our server
   - BillingTransaction created
   - Receipt email sent
        ↓
5. Payment success
   - currentPeriodEnd updated
   - Status: ACTIVE
   - User continues using platform
        ↓
6a. Payment fails
   - Email sent to user
   - Can retry or update payment method
        ↓
6b. User cancels subscription
   - Status: CANCELLED
   - Can still use until period end
```

---

## Widget Load & Communication

```
Website owner adds embed code:
<script src="https://cdn.example.com/widget.js"></script>
<script>
  window.IntelliConvoConfig = {
    siteId: 'abc123',
    apiUrl: 'https://api.example.com'
  }
</script>

        ↓
1. Widget.js loads (200-300 KB)
2. Creates IntelliConvoWidget instance
        ↓
3. Initializes managers:
   - StorageManager (localStorage)
   - SocketManager (Socket.IO)
   - AnalyticsManager
   - SettingsManager
        ↓
4. Validates site (optional)
   - GET /api/v1/widget/:siteId/validate
   - Checks active hosts
        ↓
5. Connects Socket.IO
   - ws://api.example.com/socket.io
   - Joins site room
        ↓
6. Loads widget settings
   - GET /api/v1/widget/:siteId/settings
   - Applies 150+ customization options
        ↓
7. Renders launcher button
   - Position, size, color, animation
   - Click opens chat window
        ↓
8. User opens chat
   - Loads conversation history (localStorage)
   - Shows greeting message
   - Ready to chat
        ↓
9. User sends message
   - Socket event: 'send-message'
   - Backend processes and responds
   - Streaming response displayed
        ↓
10. Analytics tracked
   - Message count
   - Session duration
   - User interactions
```

---

## Human Handoff Flow

```
User chatting with AI
        ↓
1. Clicks "Talk to a Human" button
   (appears after first AI message)
        ↓
2. Widget emits socket event: 'request-agent'
   - conversationId: actual DB conversation ID
   - reason: "User requested human agent"
        ↓
3. Backend:
   - Mark conversation: status = NEEDS_AGENT
   - Create notification for admins
   - Emit 'conversation-status-changed'
        ↓
4. Widget receives status change
   - Hide chat input
   - Show "Waiting for agent..." message
        ↓
5. Admin dashboard
   - Shows notification: pending escalation
   - Views "Agent Queue" section
   - Sees user conversation waiting
        ↓
6. Agent clicks "Take Conversation"
   - Backend assigns: assignedAgentId = agent.id
   - Status: AGENT_ACTIVE
   - Emit 'agent-joined'
        ↓
7. Widget receives 'agent-joined'
   - Show "Agent has joined" message
   - Unhide chat input
   - Change colors/styling for agent messages
        ↓
8. Agent types message
   - Socket event: 'send-message' with role: AGENT
   - Both user and agent see messages
   - Real-time typing indicator
        ↓
9. Agent resolves conversation
   - Clicks "Close Conversation"
   - Status: RESOLVED
   - Widget shows rating prompt (1-5 stars)
        ↓
10. User rates interaction
   - Saves feedback
   - Conversation archived
```

---

## Admin Dashboard Architecture

```
Admin Portal (Next.js)
        ├─ /admin/dashboard
        │  └─ Overview, stats, recent activity
        │
        ├─ /admin/users
        │  └─ List, search, view, edit users
        │
        ├─ /admin/sites
        │  └─ Create, edit, delete sites
        │  └─ View crawl status
        │  └─ Manage knowledge base
        │
        ├─ /admin/conversations
        │  └─ View all conversations
        │  └─ Agent queue
        │  └─ Take conversation
        │  └─ Send messages
        │  └─ Rate interactions
        │
        ├─ /admin/subscriptions
        │  └─ List subscriptions
        │  └─ Edit plans
        │  └─ Extend trial
        │  └─ Cancel subscription
        │
        ├─ /admin/billing
        │  └─ Billing history
        │  └─ Payment tracking
        │  └─ Refund processing
        │
        ├─ /admin/emails
        │  └─ Email log
        │  └─ Resend failed emails
        │  └─ Email templates
        │
        ├─ /admin/settings
        │  └─ Rate limits
        │  └─ Auth providers
        │  └─ AI configuration
        │  └─ Email settings
        │
        └─ /admin/audit
           └─ Audit log
           └─ Admin actions
           └─ Changes tracking
```

---

## Technology Stack Matrix

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js 18+ | Runtime |
| | Express.js | Web framework |
| | TypeScript | Type safety |
| | Prisma | ORM |
| | PostgreSQL | Relational database |
| | Redis | Cache & queues |
| | Socket.IO | Real-time communication |
| | BullMQ | Job queuing |
| | Winston | Logging |
| **Frontend** | Next.js 14 | React framework |
| | React 18 | UI library |
| | TypeScript | Type safety |
| | Tailwind CSS | Styling |
| | Radix UI | Component library |
| | Zustand | State management |
| | TanStack Query | Server state |
| **Widget** | Vanilla TypeScript | No dependencies |
| | Webpack 5 | Bundling |
| | Socket.IO Client | Real-time |
| **Database** | PostgreSQL 16 | Primary database |
| | Prisma | ORM |
| **External** | OpenAI | GPT-4, embeddings |
| | Pinecone | Vector database |
| | Stripe | Payments |
| | Resend | Email delivery |
| **Deployment** | Docker | Containerization |
| | Docker Compose | Orchestration |

---

## Performance Characteristics

```
Typical Response Times:
├─ Chat message          200-500ms (includes AI response)
├─ Website crawling      10-60s per URL (depends on size)
├─ Embedding generation  2-5s per batch
├─ Search (semantic)     50-200ms
├─ Login                 200-300ms
├─ Widget load          1-2s (cached)
└─ Page navigation       100-300ms (Next.js cached)

Concurrent Connections:
├─ Frontend users        200+
├─ Socket.IO clients     1000+
├─ Database connections  50 (connection pool)
└─ Redis connections     20

Storage:
├─ Database (1M messages)  ~2-5 GB
├─ Vectors (10k chunks)    ~50-100 MB
├─ Uploads (PDFs)          Variable (limit: 100 MB)
└─ Logs (per day)         ~100-500 MB
```

---

## Security Architecture

```
Layer 1: Transport
├─ HTTPS/TLS (production)
├─ Secure WebSocket (WSS)
└─ CORS headers

Layer 2: Authentication
├─ JWT tokens (15 min expiry)
├─ Refresh tokens (7 day expiry)
├─ Token blacklist (logout)
├─ Bcrypt password hashing
└─ OAuth 2.0 providers

Layer 3: Authorization
├─ Role-based access (ADMIN/USER)
├─ User resource isolation
├─ Site ownership validation
└─ Conversation access checks

Layer 4: Input Validation
├─ Zod schema validation
├─ Request body limits
├─ Rate limiting (global + per-route)
└─ Login attempt tracking

Layer 5: Application
├─ SQL injection protection (Prisma)
├─ XSS prevention (HTML sanitization)
├─ CSRF protection (same-site cookies)
├─ Error message sanitization
└─ Sensitive data masking

Layer 6: Database
├─ Parameterized queries
├─ Field-level access control
├─ Encrypted sensitive fields (to implement)
└─ Audit logging
```

---

## Scaling Considerations

```
Current Architecture:
├─ Single backend instance
├─ Single database
├─ Single Redis instance
└─ Can handle: ~1,000 concurrent users

Scaling to 10,000+ users:
├─ Multiple backend instances (load balanced)
├─ Database read replicas
├─ Redis cluster
├─ Static asset CDN
├─ Horizontal widget scaling
└─ Message queue optimization

Scaling to 100,000+ users:
├─ Microservices architecture
├─ Database sharding
├─ Distributed caching
├─ Message queue partitioning
├─ Multi-region deployment
└─ Custom embedding service
```

---

**See also**: 
- `CODEBASE_ANALYSIS.md` - Full code analysis
- `ANALYSIS_SUMMARY.md` - Quick reference
- `CLAUDE.md` - Development guide

