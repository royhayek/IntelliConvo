# ==========================================
# Widget Dockerfile - Multi-stage Build
# ==========================================
# Stage 1: Builder
# Stage 2: Production (nginx for static serving)
# ==========================================

# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG WIDGET_API_URL
ENV WIDGET_API_URL=$WIDGET_API_URL

# Build widget
RUN npm run build

# ==========================================
# Stage 2: Production (nginx)
# ==========================================
FROM nginx:alpine AS runner

# Copy built widget files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/widget.js || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
