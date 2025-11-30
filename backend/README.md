# IntelliConvo Backend

Node.js API server for the IntelliConvo platform. Handles authentication, website crawling, AI chat, vector embeddings, and subscription management.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Vector Database**: Pinecone
- **Cache/Queue**: Redis 7 with BullMQ
- **Real-time**: Socket.io
- **AI**: OpenAI (GPT-4, text-embedding-3-small)
- **Crawling**: Crawlee with Playwright
- **Authentication**: Passport.js (JWT, Google, GitHub, Microsoft OAuth)
- **Payments**: Stripe
- **Email**: Resend or SMTP (Nodemailer)
- **Storage**: AWS S3 or S3-compatible services

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Application entry point
│   ├── routes/               # API route handlers
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── sites.ts          # Site management
│   │   ├── conversations.ts  # Chat conversations
│   │   ├── billing.ts        # Subscription management
│   │   ├── account.ts        # User account
│   │   ├── widget.ts         # Widget configuration
│   │   ├── admin.ts          # Admin panel
│   │   ├── notifications.ts  # User notifications
│   │   ├── webhooks.ts       # Stripe webhooks
│   │   └── config.ts         # Platform configuration
│   ├── services/             # Business logic
│   │   ├── ai.ts             # OpenAI integration
│   │   ├── crawler.ts        # Website crawling
│   │   ├── embeddings.ts     # Vector embeddings
│   │   ├── socket.ts         # Socket.io handler
│   │   ├── cache.ts          # Redis caching
│   │   ├── fileProcessor.ts  # PDF processing
│   │   ├── widgetSettings.ts # Widget configuration
│   │   ├── auth/             # Authentication services
│   │   ├── billing/          # Payment services
│   │   ├── subscription/     # Plan management
│   │   ├── conversation/     # Chat services
│   │   ├── site/             # Site services
│   │   ├── url/              # URL management
│   │   ├── file/             # File upload services
│   │   ├── discovery/        # Sitemap discovery
│   │   ├── notification/     # Notification services
│   │   ├── admin/            # Admin services
│   │   ├── email/            # Email services
│   │   └── widget/           # Widget services
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # JWT authentication
│   │   ├── validate.ts       # Zod validation
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   ├── requestLogger.ts  # Request logging
│   │   ├── correlationId.ts  # Request tracking
│   │   ├── performance.ts    # Performance metrics
│   │   ├── adminAudit.ts     # Admin audit logging
│   │   ├── maintenance.ts    # Maintenance mode
│   │   ├── widgetCors.ts     # Widget CORS
│   │   └── contentType.ts    # Content-type validation
│   ├── queues/               # Background job processing
│   │   └── index.ts          # BullMQ queue definitions
│   ├── schemas/              # Zod validation schemas
│   ├── dto/                  # Data Transfer Objects
│   ├── config/               # Configuration
│   └── utils/                # Utilities
│       ├── logger.ts         # Winston logger
│       └── response.ts       # API response helpers
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- OpenAI API Key
- Pinecone Account

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data (creates admin user)
npx prisma db seed

# Start development server
npm run dev
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with live reload (tsx watch) |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm test` | Run Jest tests |
| `npx prisma generate` | Generate Prisma client after schema changes |
| `npx prisma db push` | Push schema directly to database |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma studio` | Open database browser |
| `npx prisma db seed` | Seed initial data |

## API Routes

All routes are prefixed with `/api/v1`.

### Authentication (`/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login with email/password
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout and invalidate tokens
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /verify-email` - Verify email address
- `GET /google` - Google OAuth
- `GET /github` - GitHub OAuth
- `GET /microsoft` - Microsoft OAuth

### Sites (`/sites`)
- `GET /` - List user's sites
- `POST /` - Create new site
- `GET /:id` - Get site details
- `PUT /:id` - Update site
- `DELETE /:id` - Delete site
- `POST /:id/discover` - Discover URLs from sitemap
- `POST /:id/crawl` - Start crawling selected URLs
- `POST /:id/pause` - Pause crawling
- `POST /:id/resume` - Resume crawling
- `GET /:id/urls` - Get site URLs
- `PUT /:id/urls` - Update URL selection
- `GET /:id/files` - Get uploaded files
- `POST /:id/files` - Upload file (PDF)
- `DELETE /:id/files/:fileId` - Delete file

### Conversations (`/conversations`)
- `GET /` - List conversations
- `GET /:id` - Get conversation details
- `GET /:id/messages` - Get messages

### Billing (`/billing`)
- `GET /subscription` - Get subscription status
- `POST /subscription` - Create subscription
- `POST /subscription/cancel` - Cancel subscription
- `GET /invoices` - List invoices

### Account (`/account`)
- `GET /` - Get account details
- `PUT /` - Update account
- `PUT /password` - Change password
- `DELETE /` - Delete account

### Widget (`/widget/:siteId`)
- `GET /config` - Get widget configuration
- `GET /starters` - Get conversation starters

### Admin (`/admin`) - Admin only
- `GET /stats` - Platform statistics
- `GET /users` - List all users
- `GET /sites` - List all sites
- `GET /subscriptions` - List subscriptions
- `GET /conversations` - List all conversations
- `GET /emails` - Email delivery log
- `GET /audit` - Audit log
- `GET /settings` - System settings
- `PUT /settings` - Update system settings

### Health
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /metrics` - Performance metrics

### API Documentation
- `GET /api/docs` - Swagger UI (development only)

## Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with auth info |
| `Site` | Chat site configuration |
| `SiteUrl` | Crawled URLs with embedding status |
| `UrlSelection` | User's selected URLs before crawling |
| `Embedding` | Vector embeddings for semantic search |
| `Conversation` | Chat sessions |
| `Message` | Individual messages |
| `ConversationStarter` | Suggested starter questions |
| `KnowledgeFile` | Uploaded documents (PDFs) |
| `ActiveHost` | Allowed widget embed hosts |
| `WidgetSettings` | Extensive widget customization (70+ fields) |

### Subscription Models

| Model | Description |
|-------|-------------|
| `Subscription` | Plan subscription tracking |
| `BillingInfo` | Stripe customer data |
| `BillingTransaction` | Invoice records |

### System Models

| Model | Description |
|-------|-------------|
| `SystemSetting` | Platform-wide configuration |
| `AuditLog` | Admin action audit trail |
| `EmailLog` | Email delivery tracking |
| `RefreshToken` | JWT refresh tokens |
| `Notification` | In-app notifications |

## Background Jobs

Using BullMQ with Redis:

| Queue | Purpose |
|-------|---------|
| `crawl` | Website crawling jobs |
| `embedding` | Vector embedding generation |
| `email` | Transactional and marketing emails |
| `webhook` | External webhook delivery |

## Socket.io Events

### Client to Server
- `join-site` - Join site room for updates
- `leave-site` - Leave site room
- `send-message` - Send chat message

### Server to Client
- `message` - New message (streamed)
- `message-complete` - Message finished
- `typing` - Typing indicator
- `error` - Error notification
- `crawl-progress` - Crawl status update

## Environment Variables

### Required

```bash
# Server
NODE_ENV=development
PORT=5001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/intelliconvo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (min 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=intelliconvo
PINECONE_DIMENSIONS=512

# URLs
FRONTEND_URL=http://localhost:3000
WIDGET_CDN_URL=http://localhost:8080
```

### Optional

```bash
# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...

# Email (Resend OR SMTP)
RESEND_API_KEY=re_...
# or
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=IntelliConvo

# S3 Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
AWS_ENDPOINT_URL=  # For S3-compatible services

# Admin Seeding
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password

# Docker Deployment
RUN_MIGRATIONS=false
RUN_SEED=false
```

## Database-Managed Settings

Many settings can be configured via the Admin Settings page (`/admin/settings`) instead of environment variables:

- **AI Settings**: Model, temperature, max tokens
- **Security**: Session timeout, refresh token duration, max login attempts
- **Rate Limiting**: Request limits, windows
- **Email**: From address, from name
- **Billing**: Trial days, currency
- **Storage**: Max file size, upload directory
- **General**: Platform name, support email, maintenance mode

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.ts
```

## Stripe Webhook Testing

For local development, use the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5001/api/v1/webhooks/stripe

# Copy the webhook signing secret to .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Logging

Logs are written to:
- `logs/error.log` - Error-level logs
- `logs/all.log` - All logs
- Console (in development)

Configure log level via `LOG_LEVEL` environment variable.

## Health Checks

- `GET /health` - Returns `{ status: 'ok' }`
- `GET /health/detailed` - Returns status of all dependencies (DB, Redis, Pinecone)
