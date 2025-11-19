# Intelligentconvo Platform

A SaaS conversational AI platform that enables websites to embed intelligent chat and voice assistants. The platform automatically crawls website content, creates a knowledge base, and provides visitors with AI-powered assistance.

## 🚀 Features

- **Zero-training required**: Automatically learns from website content
- **Voice + Text enabled**: Dual interaction modes (Speak & Chat)
- **Plug and play**: Single line of code integration
- **Autonomous learning**: Continuously crawls and updates knowledge base
- **Customizable personality**: Adjust tone, focus areas, and behavior
- **Real-time chat**: WebSocket-based streaming responses
- **Vector search**: Semantic search using embeddings
- **Multi-modal**: Support for text chat and voice interactions

## 🏗️ Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Vector Database**: Pinecone for embeddings
- **Cache/Queue**: Redis + BullMQ
- **AI**: OpenAI GPT-4 + text-embedding-3-small
- **Real-time**: Socket.io
- **Widget**: Vanilla TypeScript + Webpack

## 📦 Project Structure

```
intelligentconvo-platform/
├── backend/           # Node.js API server
├── frontend/          # Next.js admin dashboard
├── widget/           # Embeddable chat widget
├── shared/           # Shared types and utilities
├── docker-compose.yml # Development environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key
- Pinecone Account

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd intelligentconvo-platform

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Run with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Widget Demo: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 3. Manual Setup (Alternative)

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Widget Setup

```bash
cd widget

# Install dependencies
npm install

# Start development server
npm run serve
```

## 🔧 Development

### Database Management

```bash
# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate client after schema changes
npx prisma generate
```

### API Testing

The backend includes several API endpoints:

- `GET /health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/sites` - List user sites
- `POST /api/sites` - Create new site
- `WebSocket /ws` - Real-time chat

### Widget Integration

To integrate the widget into a website:

```html
<script>
  (function(s,i,d,e,c,o,n,v){
    s[c]=s[c]||function(){(s[c].q=s[c].q||[]).push(arguments)};
    v=i.createElement(d);v.async=1;v.src='https://cdn.intelligentconvo.ai/widget.js';
    o=i.getElementsByTagName(d)[0];o.parentNode.insertBefore(v,o);
    s[c]('init',{siteId:'your-site-id',mode:'button'});
  })(window,document,'script','intelligentconvo');
</script>
```

## 🌐 Deployment

### Production Build

```bash
# Build all components
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=intelligentconvo-embeddings

# JWT
JWT_SECRET=your-secure-secret

# URLs
FRONTEND_URL=https://app.intelligentconvo.ai
BACKEND_URL=https://api.intelligentconvo.ai
WIDGET_CDN_URL=https://cdn.intelligentconvo.ai
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Widget tests
cd widget
npm test
```

## 📝 API Documentation

### Authentication

All API requests (except public endpoints) require a Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Main Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/sites` - List sites
- `POST /api/sites` - Create site
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id/starters` - Update conversation starters
- `POST /api/sites/:id/crawl` - Trigger site crawl

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env

2. **OpenAI API Errors**
   - Verify OPENAI_API_KEY is set
   - Check API quota and billing

3. **Widget Not Loading**
   - Check CORS configuration
   - Verify widget CDN URL
   - Check browser console for errors

4. **Crawling Issues**
   - Ensure target website allows crawling
   - Check robots.txt compliance
   - Verify network connectivity

### Logs

```bash
# Docker logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs widget

# Local logs
tail -f backend/logs/error.log
tail -f backend/logs/all.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Contact: support@intelligentconvo.ai
- Documentation: https://docs.intelligentconvo.ai