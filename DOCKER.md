# Docker Deployment Guide

This guide covers deploying IntelliConvo using Docker for both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Production Deployment](#production-deployment)
- [Configuration Reference](#configuration-reference)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** >= 20.10
- **Docker Compose** >= 2.0

### Required API Keys

Before starting, you'll need:

1. **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com/api-keys)
2. **Pinecone API Key** - Get from [app.pinecone.io](https://app.pinecone.io/)

### Optional API Keys

- **Stripe** - For payment processing ([dashboard.stripe.com](https://dashboard.stripe.com/apikeys))
- **Resend** - For email sending ([resend.com](https://resend.com/))
- **OAuth Providers** - Google, GitHub, Microsoft for social login
- **AWS S3** - For cloud file storage

---

## Quick Start (Development)

### 1. Clone and Configure

```bash
# Navigate to project directory
cd IntelligentConvo

# Copy environment template
cp .env.docker.example .env

# Edit .env and add your API keys (minimum required):
# - OPENAI_API_KEY
# - PINECONE_API_KEY
```

### 2. Start Services

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend, Widget)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. Access Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |
| Widget | http://localhost:8080 |
| API Docs | http://localhost:5001/api/docs |

### 4. Default Admin Login

- **Email:** admin@intelliconvo.com
- **Password:** Admin123!@#

> ⚠️ Change these credentials immediately after first login!

---

## Production Deployment

### Option A: Simple Deployment (Separate Ports)

Use `docker-compose.yml` when you want each service on its own port:

```bash
# Copy and configure environment
cp .env.docker.example .env

# Edit .env with production values
nano .env

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
```

### Option B: Production with Nginx (Recommended)

Use `docker-compose.prod.yml` for a proper production setup with nginx reverse proxy:

```bash
# Copy and configure environment
cp .env.docker.example .env

# Edit .env with production values (including your domain)
nano .env

# Update nginx config with your domain
nano docker/nginx/nginx.conf
# Change: server_name _; to server_name yourdomain.com;

# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Option C: Production with SSL

For HTTPS support:

1. **Obtain SSL Certificates** (Let's Encrypt recommended):

```bash
# Install certbot
apt-get install certbot

# Get certificates (stop nginx first if running on port 80)
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

2. **Copy certificates**:

```bash
mkdir -p docker/nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/
```

3. **Update nginx configuration**:

```bash
# Use SSL config instead of default
cp docker/nginx/nginx-ssl.conf docker/nginx/nginx.conf

# Edit and update domain name
nano docker/nginx/nginx.conf
# Change: server_name yourdomain.com www.yourdomain.com;
```

4. **Update docker-compose.prod.yml**:

```yaml
# Uncomment SSL volume mount in nginx service:
volumes:
  - ./docker/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - ./docker/nginx/ssl:/etc/nginx/ssl:ro  # Uncomment this line

# Uncomment port 443:
ports:
  - "80:80"
  - "443:443"  # Uncomment this line
```

5. **Deploy**:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Configuration Reference

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `your-super-secure-secret...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `PINECONE_API_KEY` | Pinecone API key | `pc-...` |
| `PINECONE_INDEX_NAME` | Pinecone index name | `intelliconvo` |

#### Database Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `intelliconvo` | Database name |
| `REDIS_PASSWORD` | (empty) | Redis password (optional) |

#### URL Variables

| Variable | Description |
|----------|-------------|
| `FRONTEND_URL` | Public URL of frontend (e.g., `https://app.yourdomain.com`) |
| `WIDGET_CDN_URL` | Public URL of widget (e.g., `https://yourdomain.com/widget`) |
| `NEXT_PUBLIC_API_URL` | API URL for frontend build (e.g., `https://api.yourdomain.com/api/v1`) |
| `WIDGET_API_URL` | API URL for widget build (e.g., `https://api.yourdomain.com`) |

#### Optional Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `RESEND_API_KEY` | Resend API key for emails |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 storage |
| `ADMIN_EMAIL` | Custom admin email (default: admin@intelliconvo.com) |
| `ADMIN_PASSWORD` | Custom admin password (default: Admin123!@#) |

### Port Configuration

| Service | Default Port | Environment Variable |
|---------|--------------|---------------------|
| Frontend | 3000 | `FRONTEND_PORT` |
| Backend | 5001 | `BACKEND_PORT` |
| Widget | 8080 | `WIDGET_PORT` |
| PostgreSQL | 5432 | `POSTGRES_PORT` |
| Redis | 6379 | `REDIS_PORT` |

---

## Commands Reference

### Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Start specific service
docker-compose -f docker-compose.dev.yml up -d backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Rebuild after code changes
docker-compose -f docker-compose.dev.yml up -d --build

# Reset everything (including data)
docker-compose -f docker-compose.dev.yml down -v
```

### Production

```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Update (rebuild and restart)
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down

# Restart single service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Operations

```bash
# Access PostgreSQL
docker exec -it intelliconvo-postgres psql -U postgres -d intelliconvo

# Create database backup
docker exec intelliconvo-postgres pg_dump -U postgres intelliconvo > backup.sql

# Restore database backup
docker exec -i intelliconvo-postgres psql -U postgres intelliconvo < backup.sql

# Run Prisma migrations manually
docker exec intelliconvo-backend npx prisma db push

# Run database seed manually
docker exec intelliconvo-backend npx prisma db seed
```

### Redis Operations

```bash
# Access Redis CLI
docker exec -it intelliconvo-redis redis-cli

# Clear Redis cache
docker exec intelliconvo-redis redis-cli FLUSHALL
```

### Maintenance

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a

# View container logs
docker logs intelliconvo-backend --tail 100 -f
```

---

## Troubleshooting

### Common Issues

#### 1. "Database connection refused"

The backend is trying to connect before PostgreSQL is ready.

```bash
# Check PostgreSQL status
docker-compose logs postgres

# Restart backend
docker-compose restart backend
```

#### 2. "Redis connection failed"

```bash
# Check Redis status
docker-compose logs redis

# Test Redis connection
docker exec intelliconvo-redis redis-cli ping
```

#### 3. "Port already in use"

Another service is using the port.

```bash
# Find process using port 5001
lsof -i :5001

# Or change the port in .env
BACKEND_PORT=5002
```

#### 4. "Build failed - out of memory"

Docker needs more memory (common on VPS with low RAM).

```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 5. "Prisma migration failed"

```bash
# Reset database and re-migrate
docker exec intelliconvo-backend npx prisma db push --force-reset
docker exec intelliconvo-backend npx prisma db seed
```

#### 6. "Widget not loading on external site"

CORS issue - ensure your domain is properly configured:

```bash
# Check WIDGET_CDN_URL in .env
WIDGET_CDN_URL=https://yourdomain.com/widget
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail 100 backend
```

### Health Checks

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Backend health
curl http://localhost:5001/api/health

# Frontend health
curl http://localhost:3000/

# PostgreSQL health
docker exec intelliconvo-postgres pg_isready

# Redis health
docker exec intelliconvo-redis redis-cli ping
```

---

## Architecture Overview

```
                                    ┌─────────────┐
                                    │   Browser   │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │    Nginx    │
                                    │  (Port 80)  │
                                    └──────┬──────┘
                          ┌────────────────┼────────────────┐
                          │                │                │
                   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                   │  Frontend   │  │   Backend   │  │   Widget    │
                   │ (Next.js)   │  │  (Express)  │  │  (Static)   │
                   │  Port 3000  │  │  Port 5001  │  │  Port 8080  │
                   └─────────────┘  └──────┬──────┘  └─────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                   │ PostgreSQL  │  │    Redis    │  │  Pinecone   │
                   │  Port 5432  │  │  Port 6379  │  │   (Cloud)   │
                   └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Updating

To update to a new version:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker exec intelliconvo-backend npx prisma db push
```

---

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review container logs for error messages
- Ensure all required environment variables are set
