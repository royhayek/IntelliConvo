# IntelliConvo Platform

A SaaS conversational AI platform that enables websites to embed intelligent chat and voice assistants. The platform automatically crawls website content, creates vector embeddings for semantic search, and provides visitors with AI-powered assistance.

## Features

- **Zero-training required** - Automatically learns from website content through intelligent crawling
- **Voice + Text modes** - Dual interaction modes (Speak & Chat) with speech-to-text and text-to-speech
- **Single-script embed** - Integrate with one line of code on any website
- **URL selection** - Choose which pages to include in your knowledge base
- **PDF uploads** - Upload documents to expand your knowledge base
- **Real-time streaming** - WebSocket-based streaming responses via Socket.io
- **Vector search** - Semantic search using OpenAI embeddings and Pinecone
- **70+ widget settings** - Extensive customization for colors, fonts, behavior, and accessibility
- **Multi-auth support** - Email, Google, GitHub, and Microsoft OAuth
- **Subscription billing** - Stripe integration with trial periods and plan management
- **Admin dashboard** - Complete platform management with audit logging

## Architecture

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Vector DB** | Pinecone |
| **Cache/Queue** | Redis 7, BullMQ |
| **AI** | OpenAI GPT-4, text-embedding-3-small |
| **Real-time** | Socket.io |
| **Widget** | Vanilla TypeScript, Webpack 5 |
| **Payments** | Stripe |
| **Email** | Resend or SMTP |
| **Storage** | AWS S3 or S3-compatible (R2, Railway, MinIO) |

## Project Structure

```
IntelligentConvo/
├── backend/             # Node.js API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, validation, rate limiting
│   │   ├── queues/      # BullMQ background jobs
│   │   └── lib/         # External integrations
│   └── prisma/          # Database schema and migrations
├── frontend/            # Next.js admin dashboard
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   └── lib/             # Hooks, API client, utilities
├── widget/              # Embeddable chat widget
│   ├── src/
│   │   ├── managers/    # State, socket, storage managers
│   │   ├── handlers/    # Message, voice, keyboard handlers
│   │   └── renderers/   # UI rendering
│   └── dist/            # Built widget.js
└── docker/              # Docker configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- OpenAI API Key
- Pinecone Account

### Option 1: Docker (Recommended)

```bash
# Copy environment template
cp .env.docker.example .env

# Edit .env with your API keys (minimum: OPENAI_API_KEY, PINECONE_API_KEY)
nano .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
# Widget: http://localhost:8080
```

See [DOCKER.md](./DOCKER.md) for detailed Docker deployment instructions.

### Option 2: Local Development

#### 1. Backend Setup

```bash
cd backend

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

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 3. Widget Setup

```bash
cd widget

# Install dependencies
npm install

# Start development server with hot reload
npm run serve
```

### Default Admin Login

After seeding the database:
- **Email:** admin@intelliconvo.com
- **Password:** Admin123!@#

## Development Commands

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with live reload (tsx watch) |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm test` | Run Jest tests |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema to database |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma studio` | Open database browser |
| `npx prisma db seed` | Seed initial data |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run generate:api` | Generate API client from backend |

### Widget

| Command | Description |
|---------|-------------|
| `npm run dev` | Build in watch mode |
| `npm run build` | Production build (minified) |
| `npm run serve` | Webpack dev server with HMR |
| `npm run preview` | Build and serve locally |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

## Widget Integration

Embed the chat widget on any website:

```html
<script>
  window.intelliconvo = window.intelliconvo || function(){
    (window.intelliconvo.q=window.intelliconvo.q||[]).push(arguments)
  };
  window.intelliconvo('init', {
    siteId: 'your-site-id',
    apiUrl: 'https://api.yourdomain.com'
  });
</script>
<script src="https://cdn.yourdomain.com/widget.js" async></script>
```

See [widget/README.md](./widget/README.md) for detailed widget documentation.

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens
- `GET /auth/google` - Google OAuth
- `GET /auth/github` - GitHub OAuth
- `GET /auth/microsoft` - Microsoft OAuth

### Sites
- `GET /sites` - List user's sites
- `POST /sites` - Create new site
- `GET /sites/:id` - Get site details
- `PUT /sites/:id` - Update site
- `DELETE /sites/:id` - Delete site
- `POST /sites/:id/crawl` - Start crawling
- `POST /sites/:id/discover` - Discover URLs from sitemap

### Conversations
- `GET /conversations` - List conversations
- `GET /conversations/:id/messages` - Get messages

### Widget (Public)
- `GET /widget/:siteId/config` - Get widget configuration
- `GET /widget/:siteId/starters` - Get conversation starters

### Health
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies

### API Documentation
- `GET /api/docs` - Swagger UI (development only)

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `OPENAI_API_KEY` | OpenAI API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name |
| `FRONTEND_URL` | Frontend URL for CORS |
| `WIDGET_CDN_URL` | Widget CDN URL for CORS |

### Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth credentials |
| `MICROSOFT_CLIENT_ID/SECRET` | Microsoft OAuth credentials |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `RESEND_API_KEY` | Resend email API key |
| `SMTP_HOST/PORT/USER/PASS` | SMTP email configuration |
| `AWS_ACCESS_KEY_ID` | S3 storage access key |
| `AWS_SECRET_ACCESS_KEY` | S3 storage secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_ENDPOINT_URL` | S3-compatible endpoint URL |

See `.env.example` files in each directory for complete configuration options.

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`

### Redis Connection Error
- Ensure Redis is running
- Check `REDIS_HOST` and `REDIS_PORT`

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly
- Check API quota and billing at [platform.openai.com](https://platform.openai.com)

### Pinecone Errors
- Verify `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`
- Ensure index dimensions match (512 for text-embedding-3-small)

### Widget Not Loading
- Check CORS configuration (`WIDGET_CDN_URL`)
- Verify `siteId` is correct
- Check browser console for errors

### Crawling Issues
- Ensure target website allows crawling
- Check if site uses JavaScript rendering (Playwright handles this)
- Verify network connectivity

## License

This project is proprietary software. All rights reserved.