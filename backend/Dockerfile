# ==========================================
# Backend Dockerfile - Multi-stage Build
# ==========================================
# Stage 1: Dependencies
# Stage 2: Builder
# Stage 3: Production Runtime
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-slim AS deps

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# ==========================================
# Stage 2: Builder
# ==========================================
# Cache bust: v2
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy prisma schema first (needed for build)
COPY prisma ./prisma/

# Regenerate Prisma client in builder context
RUN npx prisma generate

# Copy source code (includes docker-entrypoint.sh)
COPY . .

# Verify docker-entrypoint.sh was copied
RUN ls -la docker-entrypoint.sh

# Build TypeScript
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# ==========================================
# Stage 3: Production Runtime
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime dependencies
# - OpenSSL: Required by Prisma
# - Chromium dependencies: Required by Playwright for web crawling
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Set production environment
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Install Playwright browsers as root, then change ownership
RUN npx playwright install chromium && \
    chown -R nodejs:nodejs /root/.cache || true

# Copy entrypoint script from builder stage
COPY --from=builder /app/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Start application directly - Railway handles migrations via start command
CMD ["node", "dist/index.js"]
