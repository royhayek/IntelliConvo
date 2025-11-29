# IntelliConvo - Project Overview

## Executive Summary

**IntelliConvo** is a multi-tenant SaaS platform that enables websites to embed intelligent AI-powered chat assistants. The platform automatically learns from website content through crawling and semantic embeddings, requiring zero manual training to provide contextually relevant responses.

---

## Core Value Proposition

- **Zero-Configuration AI**: Automatically learns from website content without manual training
- **Plug-and-Play Integration**: Single line of code embedding
- **Voice + Text Support**: Dual interaction modes for accessibility
- **Real-time Streaming**: WebSocket-based response streaming for instant feedback
- **Extreme Customization**: 100+ appearance and behavior settings

---

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API server |
| TypeScript | Type-safe development |
| PostgreSQL + Prisma | Relational database & ORM |
| Redis + BullMQ | Caching & background jobs |
| Socket.io | Real-time WebSocket communication |
| Pinecone | Vector database for semantic search |
| OpenAI GPT-4 | AI response generation |
| Stripe | Subscription billing |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| Tailwind CSS | Utility-first styling |
| Radix UI | Accessible UI components |
| Zustand | Client state management |
| TanStack Query | Server state & caching |
| Socket.io-client | Real-time updates |

### Widget
| Technology | Purpose |
|------------|---------|
| Vanilla TypeScript | Lightweight, no dependencies |
| Webpack 5 | Bundling to single file |
| Socket.io-client | Backend communication |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js Dashboard)                           │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│   │Dashboard │ │   Sites  │ │ Account  │ │   Admin Panel    │   │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
│                    (Express + TypeScript)                        │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│   │  Routes  │ │ Services │ │ Queues   │ │    Middleware    │   │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │   Pinecone   │ │    OpenAI    │
│  (Database)  │ │(Cache/Queue) │ │  (Vectors)   │ │    (AI)      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EMBEDDABLE WIDGET                             │
│              (Single JS file for any website)                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│   │ Launcher │ │Chat Window│ │  Voice   │ │   File Upload    │   │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Website Crawling & Knowledge Base
- Automated crawling with Playwright/Crawlee
- Respects robots.txt and site structure
- Manual URL inclusion/exclusion
- File uploads (PDF, documents) for additional knowledge

### 2. Semantic Search & AI Responses
- OpenAI text-embedding-3-small for vector embeddings
- Pinecone vector database for semantic search
- GPT-4 for contextually relevant responses
- Streaming responses via WebSocket

### 3. Embeddable Chat Widget
- Single JavaScript file deployment
- 100+ customization options (colors, fonts, behavior)
- Voice input/output support
- Mobile-responsive design
- File attachment capability

### 4. User Dashboard
- Site management and configuration
- Conversation history and analytics
- Widget customization interface
- Knowledge base management
- Billing and subscription management

### 5. Admin Portal
- User management and moderation
- Site analytics and monitoring
- Conversation search and export
- Revenue reports and metrics
- Audit logging

### 6. Subscription & Billing
- Stripe integration for payments
- Monthly and annual plans
- 14-day free trial
- Automatic renewal handling

---

## Database Models

### Core Entities
```
User ─────────┬──────────── Site ──────────── SiteUrl ──────────── Embedding
              │                │
              │                ├──────────── WidgetSettings
              │                │
              │                ├──────────── Conversation ──────── Message
              │                │
              │                ├──────────── KnowledgeFile
              │                │
              │                └──────────── ActiveHost
              │
              └──────────── Subscription ──── BillingTransaction
```

### Key Status Flows

**Crawl Status:**
```
PENDING → CRAWLING → COMPLETED/READY
                  → FAILED
                  → PARTIAL
        → AWAITING_PAYMENT
        → PROCESSING
```

**Embedding Status:**
```
SCRAPED → PENDING → PROCESSING → READY
                              → FAILED
        → EXCLUDED
```

---

## API Structure

### Public Endpoints
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/widget/:siteId` - Widget initialization

### Protected User Endpoints
- `/api/v1/sites` - Site CRUD operations
- `/api/v1/sites/:siteId/urls` - URL management
- `/api/v1/sites/:siteId/files` - Knowledge files
- `/api/v1/conversations` - Chat history
- `/api/v1/billing` - Billing operations
- `/api/v1/account` - User profile

### Admin Endpoints
- `/api/v1/admin/users` - User management
- `/api/v1/admin/sites` - Site administration
- `/api/v1/admin/conversations` - Conversation moderation
- `/api/v1/admin/subscriptions` - Subscription management
- `/api/v1/admin/billing` - Revenue reports
- `/api/v1/admin/audit` - Audit logs
- `/api/v1/admin/stats` - Dashboard KPIs

---

## Key Workflows

### 1. Site Setup Flow
```
1. User creates site with URL
2. Crawler job queued (BullMQ)
3. Playwright crawls pages
4. Content extracted and stored
5. Payment required for embeddings
6. OpenAI generates embeddings
7. Vectors stored in Pinecone
8. Site marked READY
```

### 2. Chat Conversation Flow
```
1. Widget sends message via Socket.io
2. Conversation created/retrieved
3. Vector search finds relevant content
4. System prompt built with context
5. GPT-4 generates response
6. Response streamed back in real-time
7. Message saved with token usage
```

### 3. Subscription Flow
```
1. Site creation → 14-day trial
2. Trial expiration → Payment required
3. Stripe checkout or saved card
4. Webhook confirms payment
5. Embedding generation triggered
6. Monthly/annual auto-renewal
```

---

## External Integrations

| Service | Purpose |
|---------|---------|
| **OpenAI** | GPT-4 for chat, embeddings for search |
| **Pinecone** | Vector database for semantic search |
| **Stripe** | Subscription billing & payments |
| **Google OAuth** | Social authentication |
| **GitHub OAuth** | Social authentication |
| **Microsoft OAuth** | Social authentication |

---

## Security Features

- JWT authentication with refresh tokens
- Token blacklist for logout/revocation
- bcrypt password hashing
- Rate limiting on auth endpoints
- Helmet security headers
- CORS configuration
- Admin audit logging
- Force logout capability

---

## Widget Embedding

```html
<script>
  (function(s,i,d,e,c,o,n,v){
    s[c]=s[c]||function(){(s[c].q=s[c].q||[]).push(arguments)};
    v=i.createElement(d);v.async=1;v.src='https://cdn.intelliconvo.ai/widget.js';
    o=i.getElementsByTagName(d)[0];o.parentNode.insertBefore(v,o);
    s[c]('init',{siteId:'your-site-id',mode:'button'});
  })(window,document,'script','intelliconvo');
</script>
```

---

## Project Structure

```
intelliconvo/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Request handlers
│   │   ├── lib/            # External integrations
│   │   ├── queues/         # Background jobs
│   │   └── config/         # Configuration
│   └── prisma/             # Database schema
│
├── frontend/               # Next.js dashboard
│   ├── app/               # Page routes
│   ├── components/        # React components
│   ├── lib/               # Stores, utilities
│   └── hooks/             # React hooks
│
├── widget/                # Embeddable chat widget
    ├── src/
    │   ├── handlers/      # Event handlers
    │   ├── managers/      # Utility managers
    │   └── renderers/     # UI rendering
    └── webpack.config.js
```

---

## Development Commands

```bash
# Backend
npm run dev          # Start dev server
npm run build        # Build for production
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run migrations

# Frontend
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run lint         # Run ESLint

# Widget
npm run dev          # Build in watch mode
npm run build        # Build for production
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=...

# Auth
JWT_SECRET=...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
FRONTEND_URL=http://localhost:3000
WIDGET_CDN_URL=http://localhost:8080
```

---

## Summary

IntelliConvo is a comprehensive SaaS platform with:

- **3 main components**: Backend API, Frontend Dashboard, Embeddable Widget
- **4 databases/stores**: PostgreSQL, Redis, Pinecone, file storage
- **5 external integrations**: OpenAI, Stripe, Google, GitHub, Microsoft
- **50+ API endpoints** for users and admins
- **100+ widget customization options**
- **Enterprise-grade patterns**: Service layer, event-driven, audit logging
