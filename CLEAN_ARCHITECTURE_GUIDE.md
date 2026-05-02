# Clean Architecture Guide - IntelliConvo Platform

> **Purpose**: This document serves as a comprehensive architecture blueprint for building modern SaaS platforms with clean architecture principles, type safety, and scalable patterns.

**Use this guide to replicate the architecture in new projects while adapting to different business domains.**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Type Safety & API Contract](#4-type-safety--api-contract)
5. [Development Workflow](#5-development-workflow)
6. [Quick Start Checklist](#6-quick-start-checklist)

---

## 1. Architecture Overview

### Core Principles

1. **Single Source of Truth**: Backend defines API contract via OpenAPI/Swagger
2. **Type Safety**: End-to-end TypeScript from backend to frontend
3. **Separation of Concerns**: Clear boundaries between layers
4. **Auto-Generation**: Minimize manual code, maximize consistency
5. **Testability**: Stateless services, dependency injection ready

### Technology Stack

#### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod (runtime + type inference + OpenAPI generation)
- **Documentation**: Swagger UI + OpenAPI 3.0
- **Authentication**: JWT + Passport.js

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **API Client**: Orval (auto-generated from OpenAPI)
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod

#### Shared Infrastructure
- **Real-time**: Socket.io
- **Background Jobs**: BullMQ + Redis
- **File Storage**: AWS S3
- **Email**: Nodemailer + email service providers

---

## 2. Backend Architecture

### 2.1 Folder Structure

```
backend/src/
├── config/              # Configuration & setup
│   ├── index.ts         # Environment variables (validated with Zod)
│   ├── openapi.ts       # OpenAPI registry setup
│   ├── passport.ts      # Authentication strategies
│   └── swagger.ts       # Swagger UI configuration
│
├── dto/                 # Data Transfer Objects
│   ├── auth.dto.ts      # Authentication types
│   ├── [feature].dto.ts # Feature-specific DTOs
│   └── common.dto.ts    # Shared response types
│
├── lib/                 # External integrations
│   ├── prisma.ts        # Prisma client setup
│   ├── s3.ts            # AWS S3 client
│   └── [service].ts     # Third-party integrations
│
├── middleware/          # Express middleware
│   ├── auth.ts          # JWT authentication
│   ├── validate.ts      # Zod validation middleware
│   ├── errorHandler.ts  # Global error handler
│   ├── errors.ts        # Custom error classes
│   └── [custom].ts      # Custom middleware
│
├── queues/              # Background job processing
│   └── [job-type].ts    # BullMQ queue definitions
│
├── routes/              # API route handlers
│   ├── admin/           # Admin-specific routes
│   │   ├── [resource].ts
│   │   └── index.ts     # Admin router aggregator
│   ├── auth.ts
│   ├── [feature].ts
│   └── index.ts         # Main router aggregator
│
├── schemas/             # Zod validation schemas + OpenAPI
│   ├── auth.schema.ts
│   ├── [feature].schema.ts
│   └── index.ts         # Centralized exports
│
├── services/            # Business logic layer
│   ├── admin/           # Admin-specific services
│   │   └── [Resource]Service.ts
│   ├── [feature]/
│   │   └── [Feature]Service.ts
│   └── index.ts         # Service exports
│
├── utils/               # Helper utilities
│   ├── logger.ts        # Winston logger
│   ├── response.ts      # Response formatting
│   └── [utility].ts
│
└── index.ts             # Application entry point
```

### 2.2 Layer Separation Pattern

**Request Flow:**

```typescript
Request → Middleware → Route Handler → Service → Database → Response
```

**Implementation:**

```typescript
// 1. ROUTE LAYER (routes/sites.ts)
// Handles HTTP concerns, delegates to services

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { siteService } from '../services';
import { createSiteSchema, siteParamsSchema } from '../schemas';

const router = Router();

router.post(
  '/',
  authenticate,                          // 1. Authentication
  validateBody(createSiteSchema),        // 2. Input validation
  asyncHandler(async (req, res) => {     // 3. Async error handling
    const site = await siteService.createSite(  // 4. Service call
      req.user!.id,
      req.body
    );
    res.status(201).json(site);          // 5. Response
  })
);

// 2. SERVICE LAYER (services/site/SiteService.ts)
// Contains business logic, no HTTP concerns

export class SiteService {
  async createSite(userId: string, data: CreateSiteRequest): Promise<SiteDTO> {
    // Business validation
    const normalizedUrl = this.normalizeUrl(data.siteUrl);

    // Check business rules
    const existingSite = await prisma.site.findFirst({
      where: { userId, siteUrl: normalizedUrl }
    });

    if (existingSite) {
      throw new AlreadyExistsError('Site', 'URL');
    }

    // Database operation
    const site = await prisma.site.create({
      data: {
        userId,
        siteUrl: normalizedUrl,
        siteName: data.siteName || normalizedUrl,
        crawlStatus: 'PENDING'
      }
    });

    // Return DTO (never expose Prisma models)
    return this.mapSiteToDTO(site);
  }

  // Private helpers
  private normalizeUrl(url: string): string {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  private mapSiteToDTO(site: any): SiteDTO {
    return {
      id: site.id,
      siteUrl: site.siteUrl,
      siteName: site.siteName,
      crawlStatus: site.crawlStatus,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
    };
  }
}

// Export singleton
export const siteService = new SiteService();
```

### 2.3 Zod + OpenAPI Integration

**The Power of Single Source of Truth:**

```typescript
// schemas/sites.schema.ts

import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

extendZodWithOpenApi(z);

// 1. Define Zod schema with OpenAPI metadata
export const createSiteSchema = registry.register(
  'CreateSiteRequest',
  z.object({
    siteUrl: z.string().url('Invalid URL format').openapi({
      description: 'Website URL to crawl',
      example: 'https://example.com',
    }),
    siteName: z.string().min(1).max(100).optional().openapi({
      description: 'Optional site name',
      example: 'Example Website',
    }),
  }).openapi({
    description: 'Create a new site for chatbot integration',
  })
);

// 2. Define response schema
export const siteResponseSchema = registry.register(
  'SiteResponse',
  z.object({
    id: z.string().uuid(),
    siteUrl: z.string(),
    siteName: z.string(),
    crawlStatus: z.enum(['PENDING', 'CRAWLING', 'COMPLETED', 'FAILED', 'READY']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

// 3. Register API path
registry.registerPath({
  method: 'post',
  path: '/sites',
  summary: 'Create a new site',
  tags: ['Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createSiteSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Site created successfully',
      content: {
        'application/json': {
          schema: siteResponseSchema,
        },
      },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
  },
});

// 4. Export TypeScript types (inferred from Zod)
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type SiteResponse = z.infer<typeof siteResponseSchema>;
```

**Benefits:**
- ✅ Runtime validation (Zod)
- ✅ TypeScript types (inferred)
- ✅ OpenAPI documentation (auto-generated)
- ✅ Swagger UI (auto-updated)
- ✅ Frontend types (auto-generated via Orval)

### 2.4 Validation Middleware

```typescript
// middleware/validate.ts

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from './errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new ValidationError('Request body validation failed', errors);
    }

    // Replace req.body with validated & typed data
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('URL parameters validation failed', errors);
    }

    req.params = result.data as any;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Query parameters validation failed', errors);
    }

    req.query = result.data as any;
    next();
  };
}
```

### 2.5 Error Handling Pattern

**Custom Error Classes:**

```typescript
// middleware/errors.ts

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly isOperational: boolean = true,
    public readonly data?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: new Date().toISOString(),
        ...(this.data && { details: this.data }),
      },
    };
  }
}

// Specific error types
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(404, ErrorCode.NOT_FOUND, message, true, { resource, identifier });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, data?: any) {
    super(400, ErrorCode.VALIDATION_ERROR, message, true, data);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, ErrorCode.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(403, ErrorCode.FORBIDDEN, message);
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string, field: string) {
    super(
      409,
      ErrorCode.ALREADY_EXISTS,
      `${resource} with this ${field} already exists`,
      true,
      { resource, field }
    );
  }
}
```

**Global Error Handler:**

```typescript
// middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    // Zod validation errors
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    appError = new ValidationError('Request validation failed', errors);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma errors
    appError = handlePrismaError(error);
  } else {
    // Unknown errors
    appError = new AppError(
      500,
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      false
    );
  }

  // Log error
  if (appError.isOperational) {
    logger.warn('Operational error', { error: appError, path: req.path });
  } else {
    logger.error('Non-operational error', { error: appError, path: req.path });
  }

  // Send response
  res.status(appError.statusCode).json(appError.toJSON());
};

// Async route wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### 2.6 DTO Pattern

**Separation of API Contract from Database Models:**

```typescript
// dto/site.dto.ts

import { CrawlStatus } from '@prisma/client';

/**
 * Basic site information (API contract)
 * DTOs separate internal models from external API
 */
export interface SiteDTO {
  id: string;
  userId: string;
  siteUrl: string;
  siteName: string;
  crawlStatus: CrawlStatus;
  createdAt: string;  // Always ISO string, not Date
  updatedAt: string;
}

/**
 * Site with metadata (computed fields)
 */
export interface SiteWithMetaDTO extends Omit<SiteDTO, 'userId'> {
  urlCount: number;
  subscription: SiteSubscriptionSummary | null;
  _count?: {
    urls: number;
    conversations: number;
  };
}

/**
 * Request DTOs (input)
 */
export interface CreateSiteRequest {
  siteUrl: string;
  siteName?: string;
  siteDescription?: string;
}

export interface UpdateSiteRequest {
  siteName?: string;
  siteDescription?: string;
}

/**
 * Response DTOs (output)
 */
export interface SiteListResponse {
  success: true;
  data: SiteWithMetaDTO[];
  timestamp: string;
}

export interface SiteDetailsResponse {
  success: true;
  data: SiteWithMetaDTO;
  timestamp: string;
}
```

**Common DTOs:**

```typescript
// dto/common.dto.ts

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
  };
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}
```

### 2.7 OpenAPI Configuration

```typescript
// config/openapi.ts

import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

export const registry = new OpenAPIRegistry();

// Register security schemes
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter your JWT token',
});

// Generate OpenAPI document
export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Your Platform API',
      version: '1.0.0',
      description: 'Platform API documentation',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5001/api/v1',
        description: 'Development server',
      },
    ],
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'User authentication' },
      { name: 'Sites', description: 'Site management' },
      // Add your domain tags
    ],
  });
}
```

```typescript
// config/swagger.ts

import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { generateOpenAPIDocument } from './openapi';

// Import all schemas to register them
import '../schemas/auth.schema';
import '../schemas/sites.schema';
// Import all your schemas

export const setupSwagger = (app: Express): void => {
  const openApiDocument = generateOpenAPIDocument();

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: 'API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }));

  // JSON endpoint for Orval
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiDocument);
  });
};
```

### 2.8 Authentication Pattern

```typescript
// middleware/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError } from './errors';
import { prisma } from '../lib/prisma';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // 3. Load user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', decoded.userId);
    }

    // 4. Attach to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Admin authorization
export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.user.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }

  next();
};
```

---

## 3. Frontend Architecture

### 3.1 Folder Structure

```
frontend/
├── app/                     # Next.js 14 App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── admin/              # Admin portal
│   │   ├── layout.tsx      # Admin layout with sidebar
│   │   ├── page.tsx        # Admin dashboard
│   │   └── [resource]/     # Resource pages
│   ├── auth/               # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── dashboard/          # User dashboard
│   └── [feature]/          # Feature pages
│
├── components/             # React components
│   ├── ui/                # Base UI components (Radix UI)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   └── ... (70+ components)
│   ├── admin/             # Admin-specific components
│   │   └── [resource]/    # Resource components
│   ├── [feature]/         # Feature components
│   └── providers.tsx      # App providers
│
├── lib/                   # Core utilities
│   ├── api/               # API integration
│   │   ├── axios-instance.ts
│   │   └── generated/     # Auto-generated (Orval)
│   │       ├── models/    # TypeScript types
│   │       └── queries/   # TanStack Query hooks
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts    # Auth hooks (6 variants)
│   │   └── use[Feature]Socket.ts
│   ├── store.ts           # Zustand stores
│   ├── utils.ts           # Core utilities
│   └── utils/             # Utility modules
│
├── public/                # Static assets
└── styles/                # Global styles
```

### 3.2 API Client Generation (Orval)

**Configuration:**

```typescript
// orval.config.ts

import { defineConfig } from 'orval';

const apiUrl = process.env.ORVAL_API_URL || 'http://localhost:5001/api/docs.json';

export default defineConfig({
  api: {
    input: {
      target: apiUrl,  // OpenAPI spec from backend
    },
    output: {
      mode: 'tags-split',        // Split by OpenAPI tags
      target: './lib/api/generated/queries',
      schemas: './lib/api/generated/models',
      client: 'react-query',     // TanStack Query
      httpClient: 'axios',
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: './lib/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
```

**Generated Structure:**

```
lib/api/generated/
├── models/           # 300+ TypeScript interfaces
│   ├── siteResponse.ts
│   ├── createSiteRequest.ts
│   └── ...
└── queries/          # TanStack Query hooks
    ├── sites/
    │   └── sites.ts  # useGetSites, usePostSites, etc.
    └── ...
```

**Run Generation:**

```bash
npm run generate:api  # Regenerate when backend changes
```

### 3.3 Custom Axios Instance

```typescript
// lib/api/axios-instance.ts

import Axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - Add auth token
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors & token refresh
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await Axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return AXIOS_INSTANCE(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Show error toast
    const message = error.response?.data?.error?.message || 'An error occurred';
    toast.error(message);

    return Promise.reject(error);
  }
);

// Custom instance for Orval
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);

  return promise;
};

export default customInstance;
```

### 3.4 State Management

**Zustand Stores:**

```typescript
// lib/store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Auth Store (Persisted)
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;  // Prevent flash

  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  _setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      login: (user, tokens) => {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      _setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

// 2. UI Store (Persisted)
interface UIState {
  sidebarOpen: boolean;
  loading: boolean;
  theme: 'light' | 'dark' | 'system';

  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      loading: false,
      theme: 'system',

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setLoading: (loading) => set({ loading }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);
```

**TanStack Query Setup:**

```typescript
// components/providers.tsx

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error: any) => {
              // Don't retry on auth errors
              if (error?.response?.status === 401) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 3.5 Authentication Hooks

```typescript
// lib/hooks/useAuth.ts

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store';

// Helper: Check hydration
export function useAuthHydrated() {
  return useAuthStore((state) => state._hasHydrated);
}

// 1. Basic auth state
export function useAuth() {
  const hasHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return {
    isAuthenticated,
    isLoading: !hasHydrated,  // Prevent flash
    user,
  };
}

// 2. Protected routes (user or admin)
export function useRequireAuth(redirectTo?: string) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = redirectTo || window.location.pathname;
      router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isAuthenticated, isLoading, user };
}

// 3. Admin-only routes
export function useRequireAdmin() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const returnTo = window.location.pathname;
        router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      } else if (!isAdmin) {
        router.push('/dashboard');  // Non-admins to dashboard
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  return { isAuthenticated, isLoading, isAdmin, user };
}

// 4. Auth page redirects (login/signup)
export function useAuthRedirect(defaultRedirect = '/dashboard') {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get('returnTo') || defaultRedirect;

      // Redirect admins to admin portal
      if (user?.isAdmin && !returnTo.startsWith('/admin')) {
        router.push('/admin');
      } else {
        router.push(returnTo);
      }
    }
  }, [isLoading, isAuthenticated, user, router, defaultRedirect]);

  return { isAuthenticated, isLoading, user };
}
```

### 3.6 UI Component Pattern

**Example: Button Component (Radix UI + CVA)**

```typescript
// components/ui/button.tsx

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Usage:**

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Click Me</Button>
<Button variant="destructive" size="lg">Delete</Button>
<Button variant="outline" asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

### 3.7 Form Pattern (React Hook Form + Zod)

```typescript
// Example: Login Form

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginForm) => {
    // API call using auto-generated hook
    loginMutation.mutate({ data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

### 3.8 Page Pattern (Admin List)

```typescript
// app/admin/users/page.tsx

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAdminUsers, useDeleteAdminUsersUserId } from '@/lib/api/generated/queries';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersFilters } from '@/components/admin/users/users-filters';
import { PageHeader } from '@/components/admin/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorAlert } from '@/components/ui/error-alert';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Query
  const { data, isLoading, error } = useGetAdminUsers({
    page: page.toString(),
    limit: '20',
    search,
  });

  // Mutation
  const deleteUserMutation = useDeleteAdminUsersUserId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      },
    },
  });

  if (error) {
    return <ErrorAlert message={error.message} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" />

      <UsersFilters
        search={search}
        onSearchChange={setSearch}
      />

      <UsersTable
        users={data.users}
        pagination={data.pagination}
        onPageChange={setPage}
        onDelete={(user) => deleteUserMutation.mutate({ userId: user.id })}
      />
    </div>
  );
}
```

---

## 4. Type Safety & API Contract

### 4.1 End-to-End Type Flow

```
Backend Zod Schema → OpenAPI Spec → Orval Generation → Frontend Types
```

**Example Flow:**

```typescript
// 1. Backend: Define schema
// backend/src/schemas/sites.schema.ts
export const createSiteSchema = registry.register(
  'CreateSiteRequest',
  z.object({
    siteUrl: z.string().url(),
    siteName: z.string().optional(),
  })
);

// 2. Backend: OpenAPI generation
// Runs automatically when schemas are imported

// 3. Frontend: Run Orval
// npm run generate:api

// 4. Frontend: Use generated types
// lib/api/generated/models/createSiteRequest.ts
export interface CreateSiteRequest {
  siteUrl: string;
  siteName?: string;
}

// lib/api/generated/queries/sites/sites.ts
export const usePostSites = () => {
  return useMutation<SiteResponse, Error, { data: CreateSiteRequest }>({
    mutationFn: (body) => customInstance({ url: '/sites', method: 'POST', data: body.data }),
  });
};

// 5. Usage in component (fully typed)
const createSite = usePostSites();

createSite.mutate({
  data: {
    siteUrl: 'https://example.com',  // Type-checked
    siteName: 'Example',             // Type-checked
  }
});
```

### 4.2 Type Safety Checklist

✅ **Backend:**
- [ ] Zod schemas for all request/response types
- [ ] DTOs for all API responses
- [ ] OpenAPI registration for all routes
- [ ] Never expose Prisma models directly

✅ **Frontend:**
- [ ] Orval configuration for API generation
- [ ] Auto-generated types for all API calls
- [ ] Zod schemas for all forms
- [ ] Type-safe routing (Next.js)

---

## 5. Development Workflow

### 5.1 Adding a New Feature (Backend)

**Example: Adding "Projects" feature**

1. **Create Prisma Model:**

```prisma
// prisma/schema.prisma

model Project {
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

2. **Create DTOs:**

```typescript
// src/dto/project.dto.ts

export interface ProjectDTO {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}
```

3. **Create Zod Schema:**

```typescript
// src/schemas/project.schema.ts

import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

extendZodWithOpenApi(z);

export const createProjectSchema = registry.register(
  'CreateProjectRequest',
  z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  })
);

export const projectResponseSchema = registry.register(
  'ProjectResponse',
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

// Register paths
registry.registerPath({
  method: 'post',
  path: '/projects',
  summary: 'Create a new project',
  tags: ['Projects'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Project created',
      content: {
        'application/json': {
          schema: projectResponseSchema,
        },
      },
    },
  },
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

4. **Create Service:**

```typescript
// src/services/project/ProjectService.ts

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import { ProjectDTO, CreateProjectRequest, UpdateProjectRequest } from '../../dto/project.dto';

export class ProjectService {
  async getProjects(userId: string): Promise<ProjectDTO[]> {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(this.mapToDTO);
  }

  async createProject(userId: string, data: CreateProjectRequest): Promise<ProjectDTO> {
    const project = await prisma.project.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
      },
    });

    return this.mapToDTO(project);
  }

  async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectRequest
  ): Promise<ProjectDTO> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    return this.mapToDTO(updated);
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });
  }

  private mapToDTO(project: any): ProjectDTO {
    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}

export const projectService = new ProjectService();
```

5. **Create Route:**

```typescript
// src/routes/projects.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { projectService } from '../services';
import { createProjectSchema, updateProjectSchema, projectParamsSchema } from '../schemas';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const projects = await projectService.getProjects(req.user!.id);
    res.json({ success: true, data: projects });
  })
);

router.post(
  '/',
  authenticate,
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json({ success: true, data: project });
  })
);

router.patch(
  '/:projectId',
  authenticate,
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(
      req.params.projectId,
      req.user!.id,
      req.body
    );
    res.json({ success: true, data: project });
  })
);

router.delete(
  '/:projectId',
  authenticate,
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    await projectService.deleteProject(req.params.projectId, req.user!.id);
    res.json({ success: true, message: 'Project deleted' });
  })
);

export default router;
```

6. **Register Route:**

```typescript
// src/routes/index.ts

import projectsRouter from './projects';

app.use('/api/v1/projects', projectsRouter);
```

7. **Import Schema (for OpenAPI):**

```typescript
// src/config/swagger.ts

import '../schemas/project.schema';  // Add this line
```

### 5.2 Adding a New Feature (Frontend)

1. **Regenerate API Client:**

```bash
cd frontend
npm run generate:api
```

2. **Create Component:**

```typescript
// components/projects/projects-list.tsx

'use client';

import { useGetProjects } from '@/lib/api/generated/queries';
import { Card } from '@/components/ui/card';

export function ProjectsList() {
  const { data, isLoading } = useGetProjects();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {data?.data.map((project) => (
        <Card key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </Card>
      ))}
    </div>
  );
}
```

3. **Create Page:**

```typescript
// app/projects/page.tsx

'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import { ProjectsList } from '@/components/projects/projects-list';

export default function ProjectsPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Projects</h1>
      <ProjectsList />
    </div>
  );
}
```

### 5.3 Database Migration Workflow

```bash
# 1. Modify Prisma schema
# Edit backend/prisma/schema.prisma

# 2. Create migration
cd backend
npx prisma migrate dev --name add_projects

# 3. Generate Prisma client
npx prisma generate

# 4. (Optional) Seed database
npx prisma db seed
```

---

## 6. Quick Start Checklist

### 6.1 New Project Setup

#### Backend

```bash
# 1. Initialize project
mkdir my-platform && cd my-platform
mkdir backend frontend

# 2. Backend setup
cd backend
npm init -y
npm install express typescript @types/express prisma @prisma/client
npm install zod @asteasolutions/zod-to-openapi
npm install swagger-ui-express jsonwebtoken bcryptjs
npm install --save-dev tsx nodemon

# 3. Initialize Prisma
npx prisma init

# 4. Create folder structure
mkdir -p src/{config,dto,lib,middleware,queues,routes,schemas,services,utils}

# 5. Copy architecture files from this project:
# - src/config/openapi.ts
# - src/config/swagger.ts
# - src/middleware/auth.ts
# - src/middleware/validate.ts
# - src/middleware/errorHandler.ts
# - src/middleware/errors.ts
```

#### Frontend

```bash
# 1. Create Next.js app
cd frontend
npx create-next-app@latest . --typescript --tailwind --app

# 2. Install dependencies
npm install @tanstack/react-query axios zustand
npm install @radix-ui/react-* class-variance-authority
npm install react-hook-form @hookform/resolvers
npm install sonner
npm install --save-dev orval

# 3. Create folder structure
mkdir -p lib/{api,hooks,utils} components/{ui,admin}

# 4. Setup Orval
# Create orval.config.ts

# 5. Copy architecture files:
# - lib/api/axios-instance.ts
# - lib/store.ts
# - lib/hooks/useAuth.ts
# - components/providers.tsx
```

### 6.2 Essential Files to Copy

**Backend:**
1. `config/openapi.ts` - OpenAPI registry
2. `config/swagger.ts` - Swagger setup
3. `middleware/auth.ts` - Authentication
4. `middleware/validate.ts` - Validation
5. `middleware/errorHandler.ts` - Error handling
6. `middleware/errors.ts` - Custom errors
7. `dto/common.dto.ts` - Common types

**Frontend:**
1. `lib/api/axios-instance.ts` - API client
2. `lib/store.ts` - Zustand stores
3. `lib/hooks/useAuth.ts` - Auth hooks
4. `lib/utils.ts` - Utilities
5. `components/providers.tsx` - React providers
6. `orval.config.ts` - API generation config
7. All `components/ui/*` - UI components

### 6.3 Development Scripts

**Backend (`package.json`):**

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  }
}
```

**Frontend (`package.json`):**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "generate:api": "orval"
  }
}
```

---

## 7. Key Takeaways

### Architecture Principles

1. **Single Source of Truth**
   - Backend Zod schemas define API contract
   - OpenAPI auto-generated from schemas
   - Frontend types auto-generated from OpenAPI

2. **Type Safety Everywhere**
   - Zod for runtime validation
   - TypeScript for compile-time safety
   - No manual type definitions

3. **Clear Separation of Concerns**
   - Routes: HTTP handling
   - Services: Business logic
   - DTOs: API contracts
   - Schemas: Validation + docs

4. **Consistency Through Automation**
   - Orval for API client generation
   - Swagger for documentation
   - Zod for validation

5. **Scalable Organization**
   - Feature-based folders
   - Centralized exports
   - Predictable patterns

### Best Practices

✅ **Do:**
- Use Zod for all validation
- Return DTOs from services
- Use asyncHandler for routes
- Throw custom errors
- Centralize configuration
- Auto-generate types

❌ **Don't:**
- Expose Prisma models to API
- Put business logic in routes
- Manual type definitions
- Inline validation
- Duplicate error handling

---

## 8. Additional Resources

### Documentation

- **Zod**: https://zod.dev
- **zod-to-openapi**: https://github.com/asteasolutions/zod-to-openapi
- **Orval**: https://orval.dev
- **TanStack Query**: https://tanstack.com/query
- **Radix UI**: https://www.radix-ui.com
- **Prisma**: https://www.prisma.io

### File References (This Project)

**Backend Examples:**
- Route: `backend/src/routes/sites.ts`
- Service: `backend/src/services/site/SiteService.ts`
- Schema: `backend/src/schemas/sites.schema.ts`
- DTO: `backend/src/dto/site.dto.ts`

**Frontend Examples:**
- Page: `frontend/app/admin/users/page.tsx`
- Component: `frontend/components/admin/users/users-table.tsx`
- Hook: `frontend/lib/hooks/useAuth.ts`
- API Instance: `frontend/lib/api/axios-instance.ts`

---

## Conclusion

This architecture provides a solid foundation for building scalable, type-safe SaaS platforms. By following these patterns, you'll achieve:

- **Developer Productivity**: Auto-generation reduces boilerplate
- **Type Safety**: End-to-end TypeScript coverage
- **Maintainability**: Consistent patterns across codebase
- **Scalability**: Clear separation allows team growth
- **Quality**: Validation and error handling built-in

**Next Steps:**
1. Copy essential files to your new project
2. Adapt domain models to your business logic
3. Follow the workflow for adding features
4. Maintain consistency with these patterns

Good luck building your next platform!
