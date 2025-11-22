# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (`/backend`)
- `npm run dev` - Start development server with live reload (tsx watch)
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm test` - Run Jest tests
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma db push` - Push schema changes directly to database (development)
- `npx prisma studio` - Open Prisma Studio database browser

### Frontend (`/frontend`)
- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Widget (`/widget`)
- `npm run dev` - Build in watch mode with webpack
- `npm run build` - Build for production
- `npm run serve` - Start webpack dev server with HMR

### Docker
- `docker-compose up -d` - Start all services (PostgreSQL, Redis, Backend, Frontend, Widget)
- `docker-compose logs -f [service]` - View service logs
- `docker-compose down` - Stop all services

## Architecture Overview

This is a SaaS conversational AI platform with three main components:

### Backend (Node.js + Express + TypeScript)
- **Entry Point**: `src/index.ts`
- **Database**: PostgreSQL with Prisma ORM
- **Key Services**:
  - `src/services/` - Core business logic (crawling, AI, embeddings)
  - `src/routes/` - API endpoints organized by feature
  - `src/queues/` - BullMQ job processing for background tasks
  - `src/lib/` - External integrations (OpenAI, Pinecone, Stripe)
- **Real-time**: Socket.io for chat streaming
- **Vector Search**: Pinecone for semantic search using OpenAI embeddings

### Frontend (Next.js 14 + TypeScript + Tailwind CSS)
- **Structure**: App Router with TypeScript
- **UI**: Radix UI components + Tailwind CSS
- **State**: Zustand for client state, TanStack Query for server state
- **Auth**: JWT-based authentication
- **Real-time**: Socket.io client for live chat

### Widget (Vanilla TypeScript + Webpack)
- **Embeddable**: Single-file JavaScript widget for external websites
- **Entry Point**: `src/index.ts`
- **Build**: Webpack bundles to `dist/widget.js`
- **Integration**: Communicates with backend API and Socket.io

## Database Schema (Prisma)

Key models and relationships:
- **User** → **Site** (1:many) - Users can have multiple chat sites
- **Site** → **SiteUrl** (1:many) - Each site has multiple crawled URLs
- **SiteUrl** → **Embedding** (1:many) - URLs are chunked and embedded for vector search
- **Site** → **Conversation** → **Message** - Chat conversations and messages
- **User** → **Subscription** ← **Site** - Billing and subscription management

## Key Integrations

### OpenAI
- GPT-4 for chat responses
- text-embedding-3-small for vector embeddings
- Configuration in `src/lib/openai.ts`

### Pinecone
- Vector database for semantic search
- Index management in `src/lib/pinecone.ts`
- Used for retrieving relevant content during conversations

### Stripe
- Subscription billing and payments
- Webhook handling for subscription events
- **Test/Live Mode**: Automatically detected based on API key prefix
  - `sk_test_...` = Sandbox mode (no real charges)
  - `sk_live_...` = Production mode (real charges)
- **Local Webhook Testing**: Use Stripe CLI
  ```bash
  stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
  ```
- **Test Cards**: Use `4242 4242 4242 4242` with any future expiry and CVC

### BullMQ + Redis
- Background job processing for:
  - Website crawling (`src/queues/crawl.ts`)
  - Embedding generation
  - Email notifications
- Redis also used for caching and session storage

## Development Workflow

1. **Database Changes**: Always run `npx prisma generate` after modifying `prisma/schema.prisma`
2. **New Features**: Follow the existing patterns in `src/routes/` and `src/services/`
3. **Widget Changes**: Test locally with `npm run serve` in `/widget` directory
4. **API Testing**: Backend includes Swagger documentation at `/api/docs`

## Environment Variables

Critical environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Required for AI responses and embeddings
- `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` - Vector database
- `REDIS_HOST`, `REDIS_PORT` - For queues and caching
- `JWT_SECRET` - For authentication
- `STRIPE_SECRET_KEY` - For payments (use `sk_test_...` for sandbox, `sk_live_...` for production)
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhook verification
- `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` - Stripe price IDs for subscription plans