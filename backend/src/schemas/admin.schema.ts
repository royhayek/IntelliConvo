import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Admin Schemas
 * Centralized Zod validation schemas for admin endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// Common Admin Schemas
// ============================================

// Pagination schema
const paginationSchema = z.object({
  page: z.number().int().openapi({ description: 'Current page' }),
  limit: z.number().int().openapi({ description: 'Items per page' }),
  total: z.number().int().openapi({ description: 'Total items' }),
  totalPages: z.number().int().openapi({ description: 'Total pages' }),
});

// Message response schema
const adminMessageSchema = z.object({
  message: z.string().openapi({ description: 'Response message' }),
});

// ============================================
// Stats Schemas
// ============================================

const dashboardStatsSchema = registry.register(
  'AdminDashboardStats',
  z.object({
    users: z.object({
      total: z.number().int(),
      newThisWeek: z.number().int(),
      activeToday: z.number().int(),
    }),
    sites: z.object({
      total: z.number().int(),
      activelyUsed: z.number().int(),
    }),
    conversations: z.object({
      total: z.number().int(),
      todayCount: z.number().int(),
    }),
    subscriptions: z.object({
      activeCount: z.number().int(),
      revenue: z.number(),
    }),
  }).openapi({ description: 'Dashboard statistics' })
);

// ============================================
// User Schemas
// ============================================

const adminUserSchema = registry.register(
  'AdminUser',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string().nullable(),
    authProvider: z.enum(['EMAIL', 'GOOGLE', 'GITHUB']),
    isAdmin: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastLoginAt: z.string().nullable(),
    sitesCount: z.number().int(),
    subscriptionsCount: z.number().int(),
  }).openapi({ description: 'Admin user information' })
);

const adminUsersListSchema = registry.register(
  'AdminUsersList',
  z.object({
    users: z.array(adminUserSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin users list response' })
);

// Detailed user schema for single user view
const adminUserDetailSchema = registry.register(
  'AdminUserDetail',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string().nullable(),
    authProvider: z.enum(['EMAIL', 'GOOGLE', 'GITHUB']),
    authProviderId: z.string().nullable(),
    isAdmin: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastLoginAt: z.string().nullable(),
    forceLogoutAt: z.string().nullable(),
    activeSessions: z.number().int(),
    sites: z.array(z.object({
      id: z.string().uuid(),
      siteName: z.string(),
      siteUrl: z.string().url(),
      crawlStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
      createdAt: z.string(),
      _count: z.object({
        urls: z.number().int(),
        conversations: z.number().int(),
      }),
    })),
    subscriptions: z.array(z.object({
      id: z.string().uuid(),
      planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']),
      status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']),
      trialEndsAt: z.string().nullable(),
      currentPeriodEnd: z.string(),
      site: z.object({
        id: z.string().uuid(),
        siteName: z.string(),
      }).nullable(),
    })),
    billingInfo: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      fullName: z.string().nullable(),
      email: z.string().nullable(),
      addressLine1: z.string().nullable(),
      addressLine2: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      postalCode: z.string().nullable(),
      country: z.string().nullable(),
      companyName: z.string().nullable(),
      vatNumber: z.string().nullable(),
    }).nullable(),
    billingHistory: z.array(z.object({
      id: z.string().uuid(),
      invoiceId: z.string().nullable(),
      amount: z.number().int(),
      currency: z.string(),
      status: z.string(),
      createdAt: z.string(),
    })),
  }).openapi({ description: 'Detailed admin user information with related data' })
);

// ============================================
// Site Schemas
// ============================================

const adminSiteSchema = registry.register(
  'AdminSite',
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    siteName: z.string(),
    siteUrl: z.string().url(),
    faviconUrl: z.string().nullable().optional(),
    siteDescription: z.string().nullable().optional(),
    siteIndustry: z.string().nullable().optional(),
    crawlStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastCrawledAt: z.string().nullable(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string(),
      fullName: z.string().nullable(),
    }).optional(),
    subscription: z.object({
      id: z.string().uuid(),
      status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']),
      planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']),
    }).nullable().optional(),
    urlsCount: z.number().int(),
    conversationsCount: z.number().int(),
    filesCount: z.number().int(),
  }).openapi({ description: 'Admin site information' })
);

const adminSitesListSchema = registry.register(
  'AdminSitesList',
  z.object({
    sites: z.array(adminSiteSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin sites list response' })
);

// Detailed site schema for single site view
const adminSiteDetailSchema = registry.register(
  'AdminSiteDetail',
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    siteName: z.string(),
    siteUrl: z.string().url(),
    siteDescription: z.string().nullable(),
    siteIndustry: z.string().nullable(),
    specialInstructions: z.string().nullable(),
    welcomeMessage: z.string(),
    crawlStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastCrawledAt: z.string().nullable(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string(),
      fullName: z.string().nullable(),
    }),
    subscription: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      siteId: z.string().uuid(),
      status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']),
      planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']),
      trialEndsAt: z.string().nullable(),
      currentPeriodStart: z.string(),
      currentPeriodEnd: z.string(),
      stripeSubscriptionId: z.string().nullable(),
      stripePriceId: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      cancelledAt: z.string().nullable(),
    }).nullable(),
    widgetSettings: z.object({
      id: z.string().uuid(),
      siteId: z.string().uuid(),
      // Appearance & Branding
      primaryColor: z.string(),
      secondaryColor: z.string(),
      backgroundColor: z.string(),
      textColor: z.string(),
      textSecondaryColor: z.string(),
      borderColor: z.string(),
      fontFamily: z.string(),
      fontSize: z.number().int(),
      fontWeightNormal: z.number().int(),
      fontWeightMedium: z.number().int(),
      fontWeightBold: z.number().int(),
      borderRadius: z.number().int(),
      borderRadiusSmall: z.number().int(),
      borderRadiusButton: z.number().int(),
      borderWidth: z.number().int(),
      shadowColor: z.string(),
      shadowSize: z.string(),
      // Launcher
      launcherIcon: z.string(),
      launcherCustomIconUrl: z.string().nullable(),
      launcherSize: z.string(),
      launcherPosition: z.string(),
      launcherOffsetX: z.number().int(),
      launcherOffsetY: z.number().int(),
      launcherShape: z.string(),
      launcherBackgroundColor: z.string().nullable(),
      launcherIconColor: z.string(),
      launcherBorderColor: z.string().nullable(),
      launcherBorderWidth: z.number().int(),
      launcherText: z.string().nullable(),
      launcherTooltip: z.string(),
      launcherShowTooltip: z.boolean(),
      launcherShowBadge: z.boolean(),
      launcherBadgeColor: z.string(),
      launcherBadgeTextColor: z.string(),
      launcherAnimation: z.string(),
      launcherAnimationDelay: z.number().int(),
      // Chat Window
      chatWindowWidth: z.number().int(),
      chatWindowHeight: z.number().int(),
      chatWindowMaxHeight: z.string(),
      chatWindowZIndex: z.number().int(),
      headerBackgroundColor: z.string().nullable(),
      headerTextColor: z.string(),
      headerHeight: z.number().int(),
      headerTitle: z.string(),
      headerSubtitle: z.string().nullable(),
    }).nullable(),
    conversationStarters: z.array(z.object({
      id: z.string().uuid(),
      siteId: z.string().uuid(),
      text: z.string(),
      orderIndex: z.number().int(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
    activeHosts: z.array(z.object({
      id: z.string().uuid(),
      siteId: z.string().uuid(),
      hostName: z.string(),
      isEnabled: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
    _count: z.object({
      urls: z.number().int(),
      conversations: z.number().int(),
      knowledgeFiles: z.number().int(),
    }),
    stats: z.object({
      urls: z.object({
        total: z.number().int(),
        breakdown: z.array(z.object({
          isActive: z.boolean(),
          isExcluded: z.boolean(),
          _count: z.object({ id: z.number().int() }),
        })),
      }),
      conversations: z.object({
        total: z.number().int(),
        totalMessages: z.number().int(),
        avgMessages: z.number(),
      }),
      files: z.object({
        total: z.number().int(),
        byStatus: z.array(z.object({
          status: z.string(),
          _count: z.object({ id: z.number().int() }),
        })),
      }),
    }),
  }).openapi({ description: 'Detailed admin site information with stats' })
);

// ============================================
// URL Schemas
// ============================================

const adminUrlSchema = registry.register(
  'AdminUrl',
  z.object({
    id: z.string().uuid(),
    siteId: z.string().uuid(),
    url: z.string().url(),
    title: z.string().nullable(),
    isActive: z.boolean(),
    isExcluded: z.boolean(),
    createdAt: z.string(),
    lastCrawledAt: z.string().nullable(),
    _count: z.object({
      embeddings: z.number().int(),
    }).optional(),
  }).openapi({ description: 'Admin URL information' })
);

const adminUrlsListSchema = registry.register(
  'AdminUrlsList',
  z.object({
    urls: z.array(adminUrlSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin URLs list response' })
);

// ============================================
// Embedding Schemas
// ============================================

const adminEmbeddingSchema = registry.register(
  'AdminEmbedding',
  z.object({
    id: z.string().uuid(),
    siteUrlId: z.string().uuid(),
    chunkIndex: z.number().int(),
    chunkText: z.string(),
    createdAt: z.string(),
  }).openapi({ description: 'Admin embedding information' })
);

const adminEmbeddingsListSchema = registry.register(
  'AdminEmbeddingsList',
  z.object({
    embeddings: z.array(adminEmbeddingSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin embeddings list response' })
);

// ============================================
// File Schemas
// ============================================

const adminFileSchema = registry.register(
  'AdminFile',
  z.object({
    id: z.string().uuid(),
    siteId: z.string().uuid(),
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number().int(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
    uploadedAt: z.string(),
    processedAt: z.string().nullable(),
    errorMessage: z.string().nullable(),
  }).openapi({ description: 'Admin file information' })
);

const adminFilesListSchema = registry.register(
  'AdminFilesList',
  z.object({
    files: z.array(adminFileSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin files list response' })
);

// ============================================
// Conversation Schemas
// ============================================

const adminConversationSchema = registry.register(
  'AdminConversation',
  z.object({
    id: z.string().uuid(),
    siteId: z.string().uuid(),
    sessionId: z.string(),
    startedAt: z.string(),
    lastMessageAt: z.string(),
    messageCount: z.number().int(),
    site: z.object({
      id: z.string().uuid(),
      siteName: z.string(),
    }).optional(),
  }).openapi({ description: 'Admin conversation information' })
);

const adminConversationsListSchema = registry.register(
  'AdminConversationsList',
  z.object({
    conversations: z.array(adminConversationSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin conversations list response' })
);

// Detailed conversation schema for single conversation view
const adminConversationDetailSchema = registry.register(
  'AdminConversationDetail',
  z.object({
    id: z.string().uuid(),
    siteId: z.string().uuid(),
    sessionId: z.string(),
    startedAt: z.string(),
    lastMessageAt: z.string(),
    messageCount: z.number().int(),
    userAgent: z.string().nullable(),
    ipAddress: z.string().nullable(),
    site: z.object({
      id: z.string().uuid(),
      siteName: z.string(),
      siteUrl: z.string().url(),
      user: z.object({
        id: z.string().uuid(),
        email: z.string(),
        fullName: z.string().nullable(),
      }),
    }),
    messages: z.array(z.object({
      id: z.string().uuid(),
      role: z.enum(['USER', 'ASSISTANT']),
      content: z.string(),
      timestamp: z.string(),
      tokensUsed: z.number().int().nullable(),
      costInCents: z.number().nullable(),
    })),
    stats: z.object({
      messagesCount: z.number().int(),
      totalTokens: z.number().int(),
      totalCostCents: z.number(),
    }),
  }).openapi({ description: 'Detailed admin conversation information with messages' })
);

// ============================================
// Message Schemas
// ============================================

const adminMessageItemSchema = registry.register(
  'AdminMessage',
  z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    role: z.enum(['USER', 'ASSISTANT']),
    content: z.string(),
    timestamp: z.string(),
    tokensUsed: z.number().int().nullable(),
  }).openapi({ description: 'Admin message information' })
);

const adminMessagesListSchema = registry.register(
  'AdminMessagesList',
  z.object({
    messages: z.array(adminMessageItemSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin messages list response' })
);

// ============================================
// Subscription Schemas
// ============================================

const adminSubscriptionSchema = registry.register(
  'AdminSubscription',
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    siteId: z.string().uuid(),
    planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']),
    status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']),
    trialEndsAt: z.string().nullable(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
    createdAt: z.string(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string(),
    }).optional(),
    site: z.object({
      id: z.string().uuid(),
      siteName: z.string(),
    }).optional(),
  }).openapi({ description: 'Admin subscription information' })
);

const adminSubscriptionsListSchema = registry.register(
  'AdminSubscriptionsList',
  z.object({
    subscriptions: z.array(adminSubscriptionSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin subscriptions list response' })
);

// ============================================
// Billing Schemas
// ============================================

const adminTransactionSchema = registry.register(
  'AdminTransaction',
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    siteId: z.string().uuid(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    createdAt: z.string(),
    user: z.object({
      id: z.string().uuid(),
      email: z.string(),
    }).optional(),
  }).openapi({ description: 'Admin transaction information' })
);

const adminTransactionsListSchema = registry.register(
  'AdminTransactionsList',
  z.object({
    transactions: z.array(adminTransactionSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin transactions list response' })
);

// ============================================
// Widget Schemas
// ============================================

const adminWidgetSchema = registry.register(
  'AdminWidget',
  z.object({
    id: z.string().uuid(),
    siteId: z.string().uuid(),
    theme: z.string(),
    primaryColor: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    site: z.object({
      id: z.string().uuid(),
      siteName: z.string(),
    }).optional(),
  }).openapi({ description: 'Admin widget information' })
);

const adminWidgetsListSchema = registry.register(
  'AdminWidgetsList',
  z.object({
    widgets: z.array(adminWidgetSchema),
    pagination: paginationSchema,
  }).openapi({ description: 'Admin widgets list response' })
);

// ============================================
// PATH REGISTRATIONS - Stats
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/users',
  summary: 'Get user statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'User statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/sites',
  summary: 'Get site statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Site statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/embeddings',
  summary: 'Get embedding statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Embedding statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/files',
  summary: 'Get file statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'File statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/conversations',
  summary: 'Get conversation statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Conversation statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/subscriptions',
  summary: 'Get subscription statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Subscription statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/security',
  summary: 'Get security statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Security statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/stats/billing',
  summary: 'Get billing statistics',
  tags: ['Admin'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Billing statistics retrieved successfully', content: { 'application/json': { schema: z.object({ data: z.any() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

// ============================================
// PATH REGISTRATIONS - Users
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users',
  summary: 'Get paginated list of users',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      authProvider: z.enum(['EMAIL', 'GOOGLE', 'GITHUB']).optional(),
      isAdmin: z.string().optional(),
      sortBy: z.enum(['createdAt', 'lastLoginAt', 'email']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Users retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminUsersListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/users',
  summary: 'Create a new user',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(8),
            fullName: z.string().optional(),
            isAdmin: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'User created successfully', content: { 'application/json': { schema: z.object({ data: adminUserSchema }) } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users/export',
  summary: 'Export users',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      format: z.enum(['csv', 'json']).optional(),
      search: z.string().optional(),
      authProvider: z.enum(['EMAIL', 'GOOGLE', 'GITHUB']).optional(),
      isAdmin: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Users exported successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users/{userId}',
  summary: 'Get user by ID with full details',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'User retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminUserDetailSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/users/{userId}',
  summary: 'Update user',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fullName: z.string().optional(),
            email: z.string().email().optional(),
            isAdmin: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'User updated successfully', content: { 'application/json': { schema: z.object({ data: adminUserSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/users/{userId}',
  summary: 'Delete user',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'User deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/users/{userId}/force-logout',
  summary: 'Force logout user from all sessions',
  tags: ['Admin - Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'User logged out successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'User not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - Sites
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/sites',
  summary: 'Get paginated list of sites',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      userId: z.string().optional(),
      crawlStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
      sortBy: z.enum(['createdAt', 'lastCrawledAt', 'siteName']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Sites retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSitesListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/sites/export',
  summary: 'Export sites',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      format: z.enum(['csv', 'json']).optional(),
      search: z.string().optional(),
      userId: z.string().optional(),
      crawlStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
    }),
  },
  responses: {
    200: { description: 'Sites exported successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/sites/{siteId}',
  summary: 'Get site by ID with full details',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Site retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSiteDetailSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/sites/{siteId}',
  summary: 'Update site',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            siteName: z.string().optional(),
            siteUrl: z.string().url().optional(),
            siteDescription: z.string().optional(),
            siteIndustry: z.string().optional(),
            specialInstructions: z.string().optional(),
            welcomeMessage: z.string().optional(),
            crawlStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Site updated successfully', content: { 'application/json': { schema: z.object({ data: adminSiteSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/sites/{siteId}',
  summary: 'Delete site',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Site deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/sites/{siteId}/recrawl',
  summary: 'Trigger site recrawl',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Recrawl initiated successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/sites/{siteId}/cache/clear',
  summary: 'Clear site cache',
  description: 'Clear all cached data for a specific site',
  tags: ['Admin - Sites'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Cache cleared successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Site not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - Billing
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/transactions',
  summary: 'Get paginated list of transactions',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      userId: z.string().optional(),
      siteId: z.string().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      sortBy: z.enum(['createdAt', 'amount']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Transactions retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminTransactionsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/billing/transactions',
  summary: 'Create manual transaction',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            userId: z.string().uuid(),
            siteId: z.string().uuid(),
            amount: z.number(),
            currency: z.string().optional(),
            status: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Transaction created successfully', content: { 'application/json': { schema: z.object({ data: adminTransactionSchema }) } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/transactions/export',
  summary: 'Export transactions',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      format: z.enum(['csv', 'json']).optional(),
      userId: z.string().optional(),
      siteId: z.string().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Transactions exported successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/transactions/{transactionId}',
  summary: 'Get transaction by ID',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ transactionId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Transaction retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminTransactionSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/billing/transactions/{transactionId}',
  summary: 'Delete transaction',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ transactionId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Transaction deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/billing/transactions/{transactionId}/status',
  summary: 'Update transaction status',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ transactionId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ status: z.string() }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Transaction status updated', content: { 'application/json': { schema: z.object({ data: adminTransactionSchema }) } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/info',
  summary: 'Get paginated list of billing info records',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Billing info retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/info/{billingInfoId}',
  summary: 'Get billing info by ID',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ billingInfoId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Billing info retrieved successfully' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/stats',
  summary: 'Get billing statistics',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Billing statistics retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

// Refund endpoint
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/billing/transactions/{transactionId}/refund',
  summary: 'Issue a refund for a transaction',
  description: 'Issues a full or partial refund via Stripe API',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ transactionId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            amount: z.number().optional().openapi({ description: 'Amount to refund in cents. If not provided, full refund is issued.' }),
            reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
            adminNotes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Refund issued successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              success: z.boolean(),
              refundId: z.string(),
              amount: z.number(),
              status: z.string(),
              transaction: adminTransactionSchema,
            }),
          }),
        },
      },
    },
    400: { description: 'Invalid request or transaction not refundable' },
    401: { description: 'Unauthorized' },
    404: { description: 'Transaction not found' },
  },
});

// Disputes list endpoint
const adminDisputeSchema = registry.register(
  'AdminDispute',
  z.object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    reason: z.string(),
    created: z.number(),
    chargeId: z.string().nullable(),
    paymentIntentId: z.string().nullable(),
    evidenceDueBy: z.number().nullable(),
    isChargeRefundable: z.boolean(),
    localTransaction: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      siteId: z.string().uuid(),
      user: z.object({
        id: z.string().uuid(),
        email: z.string(),
      }).nullable(),
    }).nullable(),
  }).openapi({ description: 'Stripe dispute with local enrichment' })
);

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/disputes',
  summary: 'Get list of disputes from Stripe',
  description: 'Fetches disputes directly from Stripe API with local enrichment',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Disputes retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              disputes: z.array(adminDisputeSchema),
              pagination: paginationSchema,
              hasMore: z.boolean(),
            }),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/billing/disputes/{disputeId}',
  summary: 'Get dispute details by ID',
  description: 'Fetches detailed dispute information from Stripe with local data',
  tags: ['Admin - Billing'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ disputeId: z.string() }),
  },
  responses: {
    200: {
      description: 'Dispute retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({ data: adminDisputeSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Dispute not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - Conversations
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/conversations',
  summary: 'Get paginated list of conversations',
  tags: ['Admin - Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      siteId: z.string().optional(),
      search: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      sortBy: z.enum(['startedAt', 'lastMessageAt', 'messageCount']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Conversations retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminConversationsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/conversations/{conversationId}',
  summary: 'Get conversation by ID with messages',
  tags: ['Admin - Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ conversationId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Conversation retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminConversationDetailSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/conversations/{conversationId}',
  summary: 'Delete conversation',
  tags: ['Admin - Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ conversationId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Conversation deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/conversations/site/{siteId}',
  summary: 'Delete all conversations for a site',
  tags: ['Admin - Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Conversations deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/conversations/site/{siteId}/stats',
  summary: 'Get conversation statistics for a site',
  tags: ['Admin - Conversations'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Conversation stats retrieved successfully' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - Embeddings
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/embeddings',
  summary: 'Get paginated list of embeddings',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      siteUrlId: z.string().optional(),
      siteId: z.string().optional(),
      sortBy: z.enum(['createdAt', 'chunkIndex']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Embeddings retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminEmbeddingsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/embeddings/{embeddingId}',
  summary: 'Get embedding by ID',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ embeddingId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Embedding retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminEmbeddingSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/embeddings/{embeddingId}',
  summary: 'Delete embedding',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ embeddingId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Embedding deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/embeddings/bulk/delete',
  summary: 'Bulk delete embeddings',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ embeddingIds: z.array(z.string().uuid()) }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Embeddings deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/embeddings/site/{siteId}',
  summary: 'Delete all embeddings for a site',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Embeddings deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/embeddings/site/{siteId}/stats',
  summary: 'Get embedding statistics for a site',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Embedding stats retrieved successfully' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/embeddings/pinecone/all',
  summary: 'Delete ALL vectors from Pinecone index (DANGER ZONE)',
  description: 'This is a destructive operation that wipes the entire Pinecone index and clears all embedding records from the database. Use with extreme caution.',
  tags: ['Admin - Embeddings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'All Pinecone vectors deleted successfully', content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string() }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
    500: { description: 'Internal server error' },
  },
});

// ============================================
// PATH REGISTRATIONS - Files
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/files',
  summary: 'Get paginated list of knowledge files',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      siteId: z.string().optional(),
      status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
      fileType: z.string().optional(),
      sortBy: z.enum(['uploadedAt', 'processedAt', 'fileName', 'fileSize']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Files retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminFilesListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/files/types',
  summary: 'Get distinct file types for filtering',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'File types retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/files/stuck',
  summary: 'Get files stuck in processing',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({ hours: z.string().optional() }),
  },
  responses: {
    200: { description: 'Stuck files retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/files/{fileId}',
  summary: 'Get file by ID',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ fileId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'File retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminFileSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/files/{fileId}',
  summary: 'Update file status',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ fileId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
            errorMessage: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'File updated successfully', content: { 'application/json': { schema: z.object({ data: adminFileSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/files/{fileId}',
  summary: 'Delete file',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ fileId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'File deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/files/{fileId}/reprocess',
  summary: 'Mark file for reprocessing',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ fileId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'File marked for reprocessing', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/files/bulk/status',
  summary: 'Bulk update file status',
  tags: ['Admin - Files'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fileIds: z.array(z.string().uuid()),
            status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Files status updated', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

// ============================================
// PATH REGISTRATIONS - Messages
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/messages',
  summary: 'Get paginated list of messages',
  tags: ['Admin - Messages'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      conversationId: z.string().optional(),
      siteId: z.string().optional(),
      role: z.enum(['USER', 'ASSISTANT']).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Messages retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminMessagesListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/messages/stats',
  summary: 'Get message statistics',
  tags: ['Admin - Messages'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Message statistics retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/messages/{messageId}',
  summary: 'Get message by ID',
  tags: ['Admin - Messages'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ messageId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Message retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminMessageItemSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/messages/{messageId}',
  summary: 'Delete message',
  tags: ['Admin - Messages'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ messageId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Message deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - Subscriptions
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/subscriptions',
  summary: 'Get paginated list of subscriptions',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
      planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).optional(),
      userId: z.string().optional(),
      search: z.string().optional(),
      sortBy: z.enum(['createdAt', 'currentPeriodEnd', 'status']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Subscriptions retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSubscriptionsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/subscriptions/stats',
  summary: 'Get subscription statistics',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Subscription statistics retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/subscriptions/export',
  summary: 'Export subscriptions',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      format: z.enum(['csv', 'json']).optional(),
      status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
      planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).optional(),
      userId: z.string().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Subscriptions exported successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/subscriptions/{subscriptionId}',
  summary: 'Get subscription by ID',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ subscriptionId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Subscription retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSubscriptionSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/subscriptions/{subscriptionId}',
  summary: 'Update subscription',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ subscriptionId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
            planType: z.enum(['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL']).optional(),
            currentPeriodEnd: z.string().optional(),
            trialEndsAt: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Subscription updated successfully', content: { 'application/json': { schema: z.object({ data: adminSubscriptionSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/subscriptions/{subscriptionId}',
  summary: 'Delete subscription',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ subscriptionId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Subscription deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/subscriptions/{subscriptionId}/cancel',
  summary: 'Cancel subscription',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ subscriptionId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Subscription cancelled successfully', content: { 'application/json': { schema: z.object({ data: adminSubscriptionSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/subscriptions/{subscriptionId}/reactivate',
  summary: 'Reactivate cancelled subscription',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ subscriptionId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Subscription reactivated successfully', content: { 'application/json': { schema: z.object({ data: adminSubscriptionSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/subscriptions/{subscriptionId}/extend-trial',
  summary: 'Extend trial period',
  tags: ['Admin - Subscriptions'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ subscriptionId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ days: z.number().int().positive() }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Trial extended successfully', content: { 'application/json': { schema: z.object({ data: adminSubscriptionSchema }) } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - URLs
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/urls',
  summary: 'Get paginated list of URLs',
  tags: ['Admin - URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      siteId: z.string().optional(),
      isActive: z.string().optional(),
      isExcluded: z.string().optional(),
      hasEmbeddings: z.string().optional(),
      sortBy: z.enum(['createdAt', 'lastCrawledAt', 'url']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'URLs retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminUrlsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/urls/{urlId}',
  summary: 'Get URL by ID',
  tags: ['Admin - URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ urlId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'URL retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminUrlSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/urls/{urlId}',
  summary: 'Update URL',
  tags: ['Admin - URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ urlId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            isActive: z.boolean().optional(),
            isExcluded: z.boolean().optional(),
            title: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'URL updated successfully', content: { 'application/json': { schema: z.object({ data: adminUrlSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/urls/{urlId}',
  summary: 'Delete URL',
  tags: ['Admin - URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ urlId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'URL deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/urls/bulk/update',
  summary: 'Bulk update URLs status',
  tags: ['Admin - URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            urlIds: z.array(z.string().uuid()),
            isActive: z.boolean().optional(),
            isExcluded: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'URLs updated successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/urls/{urlId}/embeddings',
  summary: 'Delete all embeddings for a URL',
  tags: ['Admin - URLs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ urlId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'URL embeddings deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

// ============================================
// PATH REGISTRATIONS - Widgets
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/widgets',
  summary: 'Get paginated list of widget settings',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      theme: z.string().optional(),
      sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: { description: 'Widgets retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminWidgetsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/widgets/stats',
  summary: 'Get widget statistics',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Widget statistics retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/widgets/site/{siteId}',
  summary: 'Get widget settings by site ID',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ siteId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Widget retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminWidgetSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/widgets/{widgetId}',
  summary: 'Get widget settings by ID',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ widgetId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Widget retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminWidgetSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/widgets/{widgetId}',
  summary: 'Update widget settings',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ widgetId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.record(z.any()),
        },
      },
    },
  },
  responses: {
    200: { description: 'Widget updated successfully', content: { 'application/json': { schema: z.object({ data: adminWidgetSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/widgets/{widgetId}',
  summary: 'Delete widget settings',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ widgetId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Widget deleted successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/widgets/{widgetId}/reset',
  summary: 'Reset widget settings to defaults',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ widgetId: z.string().uuid() }),
  },
  responses: {
    200: { description: 'Widget reset successfully', content: { 'application/json': { schema: z.object({ data: adminWidgetSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/widgets/bulk',
  summary: 'Bulk update widget settings',
  tags: ['Admin - Widgets'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            widgetIds: z.array(z.string().uuid()),
            data: z.record(z.any()),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Widgets updated successfully', content: { 'application/json': { schema: adminMessageSchema } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

// ============================================
// System Settings Schemas
// ============================================

const settingTypeEnum = z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']);
const settingCategoryEnum = z.enum(['GENERAL', 'AI', 'SECURITY', 'RATE_LIMIT', 'EMAIL', 'BILLING', 'STORAGE']);

const adminSystemSettingSchema = registry.register(
  'AdminSystemSetting',
  z.object({
    id: z.string().uuid(),
    key: z.string(),
    value: z.string(),
    type: settingTypeEnum,
    category: settingCategoryEnum,
    label: z.string(),
    description: z.string().nullable(),
    isSecret: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    updatedBy: z.string().nullable(),
  }).openapi({ description: 'System setting' })
);

const adminSystemSettingsListSchema = registry.register(
  'AdminSystemSettingsList',
  z.object({
    settings: z.array(adminSystemSettingSchema),
  }).openapi({ description: 'System settings list response' })
);

const adminSystemSettingsByCategorySchema = registry.register(
  'AdminSystemSettingsByCategory',
  z.record(settingCategoryEnum, z.array(adminSystemSettingSchema)).openapi({ description: 'System settings grouped by category' })
);

// ============================================
// PATH REGISTRATIONS - Settings
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/settings',
  summary: 'Get all system settings',
  tags: ['Admin - Settings'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      category: settingCategoryEnum.optional(),
    }),
  },
  responses: {
    200: { description: 'Settings retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSystemSettingsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/settings/by-category',
  summary: 'Get all system settings grouped by category',
  tags: ['Admin - Settings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Settings retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSystemSettingsByCategorySchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/settings/{key}',
  summary: 'Get a specific setting by key',
  tags: ['Admin - Settings'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ key: z.string() }),
  },
  responses: {
    200: { description: 'Setting retrieved successfully', content: { 'application/json': { schema: z.object({ data: adminSystemSettingSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Setting not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/settings/{key}',
  summary: 'Update a specific setting',
  tags: ['Admin - Settings'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ key: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            value: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Setting updated successfully', content: { 'application/json': { schema: z.object({ data: adminSystemSettingSchema }) } } },
    401: { description: 'Unauthorized' },
    404: { description: 'Setting not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/admin/settings/bulk',
  summary: 'Bulk update multiple settings',
  tags: ['Admin - Settings'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            settings: z.array(z.object({
              key: z.string(),
              value: z.string(),
            })),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Settings updated successfully', content: { 'application/json': { schema: z.object({ data: adminSystemSettingsListSchema }) } } },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
  },
});

// Cache clear response schema
const cachesClearedResponseSchema = registry.register(
  'CachesClearedResponse',
  z.object({
    cleared: z.array(z.string()).openapi({ description: 'List of cache namespaces that were cleared' }),
    message: z.string().openapi({ description: 'Success message' }),
  }).openapi({ description: 'Response after clearing caches' })
);

registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/settings/cache/clear',
  summary: 'Clear all system caches',
  description: 'Clears all caches except user sessions. Safe to run anytime - caches will repopulate on next request.',
  tags: ['Admin - Settings'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Caches cleared successfully',
      content: {
        'application/json': {
          schema: z.object({ data: cachesClearedResponseSchema }),
        },
      },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin access required' },
  },
});

// Type exports
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminSite = z.infer<typeof adminSiteSchema>;
export type AdminUrl = z.infer<typeof adminUrlSchema>;
export type AdminEmbedding = z.infer<typeof adminEmbeddingSchema>;
export type AdminFile = z.infer<typeof adminFileSchema>;
export type AdminConversation = z.infer<typeof adminConversationSchema>;
export type AdminMessage = z.infer<typeof adminMessageItemSchema>;
export type AdminSubscription = z.infer<typeof adminSubscriptionSchema>;
export type AdminTransaction = z.infer<typeof adminTransactionSchema>;
export type AdminWidget = z.infer<typeof adminWidgetSchema>;
export type AdminSystemSetting = z.infer<typeof adminSystemSettingSchema>;
