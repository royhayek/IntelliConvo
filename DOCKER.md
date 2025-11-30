# Docker Deployment Guide

This guide covers deploying IntelliConvo using Docker for both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Configuration Reference](#configuration-reference)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** >= 20.10
- **Docker Compose** >= 2.0

### Required API Keys

1. **OpenAI API Key** - [platform.openai.com](https://platform.openai.com/api-keys)
2. **Pinecone API Key** - [app.pinecone.io](https://app.pinecone.io/)

### Optional API Keys

- **Stripe** - Payment processing ([dashboard.stripe.com](https://dashboard.stripe.com/apikeys))
- **Resend** - Email delivery ([resend.com](https://resend.com/))
- **OAuth Providers** - Google, GitHub, Microsoft for social login
- **AWS S3** - Cloud file storage (or S3-compatible: R2, Railway, MinIO)

## Quick Start

### 1. Configure Environment

```bash
# Copy environment template
cp .env.docker.example .env

# Edit .env and add your API keys
nano .env
```

Minimum required variables:
- `JWT_SECRET` - Generate with `openssl rand -base64 32`
- `OPENAI_API_KEY` - Your OpenAI API key
- `PINECONE_API_KEY` - Your Pinecone API key

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
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

Change these credentials immediately after first login, or set custom credentials via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

## Production Deployment

### Option A: Default Configuration

The default `docker-compose.yml` exposes each service on its own port:

```bash
# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
```

### Option B: Production with Nginx (Recommended)

Use `docker-compose.prod.yml` for a production setup with nginx reverse proxy:

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

## Configuration Reference

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | Generate: `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `PINECONE_API_KEY` | Pinecone API key | `pc-...` |
| `PINECONE_INDEX_NAME` | Pinecone index name | `intelliconvo` |
| `PINECONE_DIMENSIONS` | Embedding dimensions | `512` |

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
| `FRONTEND_URL` | Public URL of frontend for CORS |
| `WIDGET_CDN_URL` | Public URL of widget for CORS |
| `NEXT_PUBLIC_API_URL` | API URL for frontend build |
| `NEXT_PUBLIC_WIDGET_URL` | Widget URL for frontend preview |
| `WIDGET_API_URL` | API URL for widget build |

#### Optional Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `STRIPE_PRICE_MONTHLY` | Monthly plan price ID |
| `STRIPE_PRICE_ANNUAL` | Annual plan price ID |
| `RESEND_API_KEY` | Resend email API key |
| `SMTP_HOST/PORT/USER/PASS` | SMTP email configuration |
| `AWS_ACCESS_KEY_ID` | S3 storage access key |
| `AWS_SECRET_ACCESS_KEY` | S3 storage secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_ENDPOINT_URL` | S3-compatible endpoint URL |
| `ADMIN_EMAIL` | Custom admin email |
| `ADMIN_PASSWORD` | Custom admin password |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth |
| `MICROSOFT_CLIENT_ID/SECRET` | Microsoft OAuth |

### Port Configuration

| Service | Default Port | Environment Variable |
|---------|--------------|---------------------|
| Frontend | 3000 | `FRONTEND_PORT` |
| Backend | 5001 | `BACKEND_PORT` |
| Widget | 8080 | `WIDGET_PORT` |
| PostgreSQL | 5432 | `POSTGRES_PORT` |
| Redis | 6379 | `REDIS_PORT` |

## Commands Reference

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v

# Restart single service
docker-compose restart backend
```

### Production (with nginx)

```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Update (rebuild and restart)
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
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

## Troubleshooting

### Common Issues

#### Database connection refused

The backend is trying to connect before PostgreSQL is ready.

```bash
# Check PostgreSQL status
docker-compose logs postgres

# Restart backend after PostgreSQL is healthy
docker-compose restart backend
```

#### Redis connection failed

```bash
# Check Redis status
docker-compose logs redis

# Test Redis connection
docker exec intelliconvo-redis redis-cli ping
```

#### Port already in use

```bash
# Find process using port 5001
lsof -i :5001

# Or change the port in .env
BACKEND_PORT=5002
```

#### Build failed - out of memory

Docker needs more memory (common on VPS with low RAM).

```bash
# Add swap space (Linux)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Prisma migration failed

```bash
# Reset database and re-apply schema
docker exec intelliconvo-backend npx prisma db push --force-reset
docker exec intelliconvo-backend npx prisma db seed
```

#### Widget not loading on external site

CORS issue - ensure your domain is properly configured:

```bash
# In .env, set the public URL where the widget is served
WIDGET_CDN_URL=https://cdn.yourdomain.com
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
docker-compose ps

# Backend health
curl http://localhost:5001/health

# Backend detailed health
curl http://localhost:5001/health/detailed

# PostgreSQL health
docker exec intelliconvo-postgres pg_isready

# Redis health
docker exec intelliconvo-redis redis-cli ping
```

## Architecture Overview

```
                                    ┌─────────────┐
                                    │   Browser   │
                                    └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │    Nginx    │
                                    │  (Port 80)  │  (production only)
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

## Updating

To update to a new version:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run any new migrations
docker exec intelliconvo-backend npx prisma db push
```
