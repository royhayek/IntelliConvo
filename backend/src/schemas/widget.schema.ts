import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '../config/openapi';

/**
 * Widget Schemas
 * Centralized Zod validation schemas for widget endpoints with OpenAPI metadata
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============================================
// COMMON SCHEMAS
// ============================================

// Error response schema
export const errorSchema = registry.register(
  'Error',
  z.object({
    error: z.string().openapi({
      description: 'Error message',
      example: 'Resource not found',
    }),
    statusCode: z.number().int().openapi({
      description: 'HTTP status code',
      example: 404,
    }),
    code: z.string().optional().openapi({
      description: 'Application error code',
      example: 'NOT_FOUND',
    }),
    timestamp: z.string().datetime().optional().openapi({
      description: 'Error timestamp',
      example: '2023-12-07T10:30:00.000Z',
    }),
  }).openapi({
    description: 'Standard error response',
  })
);

// ============================================
// WIDGET RESPONSE SCHEMAS
// ============================================

// Conversation starter item schema
const conversationStarterSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Starter ID' }),
  starterText: z.string().openapi({
    description: 'Conversation starter text',
    example: 'How can I help you today?',
  }),
  orderIndex: z.number().int().openapi({
    description: 'Display order',
    example: 0,
  }),
  isActive: z.boolean().openapi({
    description: 'Whether the starter is active',
    example: true,
  }),
});

// Starters response schema
export const startersResponseSchema = registry.register(
  'StartersResponse',
  z.object({
    welcomeMessage: z.string().openapi({
      description: 'Welcome message for the widget',
      example: 'Hello! How can I help you today?',
    }),
    starters: z.array(conversationStarterSchema).openapi({
      description: 'Array of conversation starters',
    }),
  }).openapi({
    description: 'Widget conversation starters response',
  })
);

// Site config response schema
export const siteConfigResponseSchema = registry.register(
  'SiteConfigResponse',
  z.object({
    id: z.string().uuid().openapi({
      description: 'Site ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    siteName: z.string().openapi({
      description: 'Site name',
      example: 'My Website',
    }),
    welcomeMessage: z.string().openapi({
      description: 'Welcome message',
      example: 'Hello! How can I help you today?',
    }),
    conversationStarters: z.array(z.object({
      starterText: z.string().openapi({
        description: 'Starter text',
        example: 'What services do you offer?',
      }),
    })).openapi({
      description: 'Conversation starters',
    }),
  }).openapi({
    description: 'Site configuration for widget initialization',
  })
);

// Validate site response schema
export const validateSiteResponseSchema = registry.register(
  'ValidateSiteResponse',
  z.object({
    valid: z.boolean().openapi({
      description: 'Whether the site is valid',
      example: true,
    }),
    siteName: z.string().openapi({
      description: 'Site name',
      example: 'My Website',
    }),
    status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE']).openapi({
      description: 'Subscription status',
      example: 'ACTIVE',
    }),
  }).openapi({
    description: 'Site validation response',
  })
);

// Widget settings schema (comprehensive)
export const widgetSettingsSchema = registry.register(
  'WidgetSettings',
  z.object({
    id: z.string().uuid().openapi({ description: 'Settings ID' }),
    siteId: z.string().uuid().openapi({ description: 'Site ID' }),

    // Appearance & Branding
    primaryColor: z.string().openapi({ description: 'Primary color', example: '#6366f1' }),
    secondaryColor: z.string().openapi({ description: 'Secondary color', example: '#818cf8' }),
    backgroundColor: z.string().openapi({ description: 'Background color', example: '#ffffff' }),
    textColor: z.string().openapi({ description: 'Text color', example: '#1e293b' }),
    textSecondaryColor: z.string().openapi({ description: 'Secondary text color', example: '#64748b' }),
    borderColor: z.string().openapi({ description: 'Border color', example: '#e2e8f0' }),

    // Typography
    fontFamily: z.string().openapi({ description: 'Font family', example: 'system' }),
    fontSize: z.number().int().openapi({ description: 'Base font size in pixels', example: 14 }),
    fontWeightNormal: z.number().int().openapi({ description: 'Normal font weight', example: 400 }),
    fontWeightMedium: z.number().int().openapi({ description: 'Medium font weight', example: 500 }),
    fontWeightBold: z.number().int().openapi({ description: 'Bold font weight', example: 600 }),

    // Border & Shadows
    borderRadius: z.number().int().openapi({ description: 'Border radius in pixels', example: 12 }),
    borderRadiusSmall: z.number().int().openapi({ description: 'Small border radius', example: 8 }),
    borderRadiusButton: z.number().int().openapi({ description: 'Button border radius', example: 8 }),
    borderWidth: z.number().int().openapi({ description: 'Border width', example: 1 }),
    shadowColor: z.string().openapi({ description: 'Shadow color', example: 'rgba(0, 0, 0, 0.1)' }),
    shadowSize: z.string().openapi({ description: 'Shadow size', example: 'medium' }),

    // Launcher
    launcherIcon: z.string().openapi({ description: 'Launcher icon type', example: 'chat' }),
    launcherCustomIconUrl: z.string().nullable().openapi({ description: 'Custom launcher icon URL' }),
    launcherSize: z.number().int().openapi({ description: 'Launcher size in pixels', example: 56 }),
    launcherPosition: z.string().openapi({ description: 'Launcher position', example: 'bottom-right' }),
    launcherOffsetX: z.number().int().openapi({ description: 'Horizontal offset', example: 20 }),
    launcherOffsetY: z.number().int().openapi({ description: 'Vertical offset', example: 20 }),

    // Chat Window
    chatWindowWidth: z.number().int().openapi({ description: 'Chat window width', example: 380 }),
    chatWindowHeight: z.number().int().openapi({ description: 'Chat window height', example: 600 }),
    chatWindowMaxHeight: z.string().openapi({ description: 'Max chat window height', example: '80vh' }),
    chatWindowZIndex: z.number().int().openapi({ description: 'Z-index of chat window', example: 9999 }),

    // Header
    headerBackgroundColor: z.string().openapi({ description: 'Header background color' }),
    headerTextColor: z.string().openapi({ description: 'Header text color' }),
    headerHeight: z.number().int().openapi({ description: 'Header height', example: 64 }),
    headerTitle: z.string().openapi({ description: 'Header title', example: 'Chat with us' }),
    headerSubtitle: z.string().nullable().openapi({ description: 'Header subtitle' }),

    // Message Bubbles
    userBubbleBackgroundColor: z.string().openapi({ description: 'User bubble background color' }),
    userBubbleTextColor: z.string().openapi({ description: 'User bubble text color' }),
    assistantBubbleBackgroundColor: z.string().openapi({ description: 'Assistant bubble background color' }),
    assistantBubbleTextColor: z.string().openapi({ description: 'Assistant bubble text color' }),

    // Input
    inputBackgroundColor: z.string().openapi({ description: 'Input background color' }),
    inputTextColor: z.string().openapi({ description: 'Input text color' }),
    inputBorderColor: z.string().openapi({ description: 'Input border color' }),
    inputPlaceholder: z.string().openapi({ description: 'Input placeholder text', example: 'Type a message...' }),

    // Content
    botName: z.string().openapi({ description: 'Bot name', example: 'AI Assistant' }),
    welcomeMessage: z.string().openapi({ description: 'Welcome message' }),
    offlineMessage: z.string().openapi({ description: 'Offline message' }),

    // Behavior
    autoOpenEnabled: z.boolean().openapi({ description: 'Auto-open enabled', example: false }),
    autoOpenDelay: z.number().int().openapi({ description: 'Auto-open delay in ms', example: 5000 }),
    showTypingIndicator: z.boolean().openapi({ description: 'Show typing indicator', example: true }),
    persistConversation: z.boolean().openapi({ description: 'Persist conversation', example: true }),

    // Theme
    theme: z.string().openapi({ description: 'Theme mode', example: 'light' }),

    // Dark Mode Colors
    darkModePrimaryColor: z.string().nullable().openapi({ description: 'Dark mode primary color' }),
    darkModeSecondaryColor: z.string().nullable().openapi({ description: 'Dark mode secondary color' }),
    darkModeBackgroundColor: z.string().nullable().openapi({ description: 'Dark mode background color' }),
    darkModeSecondaryBackgroundColor: z.string().nullable().openapi({ description: 'Dark mode secondary background' }),
    darkModeTextColor: z.string().nullable().openapi({ description: 'Dark mode text color' }),
    darkModeTextSecondaryColor: z.string().nullable().openapi({ description: 'Dark mode secondary text color' }),
    darkModeBorderColor: z.string().nullable().openapi({ description: 'Dark mode border color' }),

    // Timestamps
    createdAt: z.string().datetime().openapi({ description: 'Creation timestamp' }),
    updatedAt: z.string().datetime().openapi({ description: 'Last update timestamp' }),
  }).openapi({
    description: 'Complete widget settings configuration',
  })
);

// Widget settings update schema (partial)
export const updateWidgetSettingsSchema = registry.register(
  'UpdateWidgetSettingsRequest',
  widgetSettingsSchema.partial().openapi({
    description: 'Update widget settings (all fields optional)',
  })
);

// ============================================
// Path Registrations
// ============================================

// GET /api/v1/widget/{siteId}/starters (Public)
registry.registerPath({
  method: 'get',
  path: '/api/v1/widget/{siteId}/starters',
  summary: 'Get conversation starters (public)',
  tags: ['Widget'],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved starters',
      content: {
        'application/json': {
          schema: startersResponseSchema,
        },
      },
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/widget/{siteId}/config (Public)
registry.registerPath({
  method: 'get',
  path: '/api/v1/widget/{siteId}/config',
  summary: 'Get site configuration (public)',
  tags: ['Widget'],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved config',
      content: {
        'application/json': {
          schema: siteConfigResponseSchema,
        },
      },
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/widget/{siteId}/validate (Public)
registry.registerPath({
  method: 'get',
  path: '/api/v1/widget/{siteId}/validate',
  summary: 'Validate site exists (public)',
  tags: ['Widget'],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Site validation result',
      content: {
        'application/json': {
          schema: validateSiteResponseSchema,
        },
      },
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/widget/{siteId}/settings (Public)
registry.registerPath({
  method: 'get',
  path: '/api/v1/widget/{siteId}/settings',
  summary: 'Get public widget settings',
  tags: ['Widget'],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved settings',
      content: {
        'application/json': {
          schema: widgetSettingsSchema,
        },
      },
    },
    404: {
      description: 'Site not found',
    },
  },
});

// PATCH /api/v1/widget/{siteId}/settings
registry.registerPath({
  method: 'patch',
  path: '/api/v1/widget/{siteId}/settings',
  summary: 'Update widget settings (partial)',
  tags: ['Widget'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateWidgetSettingsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Settings updated successfully',
      content: {
        'application/json': {
          schema: widgetSettingsSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// PUT /api/v1/widget/{siteId}/settings
registry.registerPath({
  method: 'put',
  path: '/api/v1/widget/{siteId}/settings',
  summary: 'Update widget settings (full replace)',
  tags: ['Widget'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateWidgetSettingsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Settings updated successfully',
      content: {
        'application/json': {
          schema: widgetSettingsSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/widget/{siteId}/settings/admin
registry.registerPath({
  method: 'get',
  path: '/api/v1/widget/{siteId}/settings/admin',
  summary: 'Get admin widget settings',
  tags: ['Widget'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved admin settings',
      content: {
        'application/json': {
          schema: widgetSettingsSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// GET /api/v1/widget/{siteId}/settings/category/{category}
registry.registerPath({
  method: 'get',
  path: '/api/v1/widget/{siteId}/settings/category/{category}',
  summary: 'Get widget settings by category',
  tags: ['Widget'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
      category: z.string().openapi({ description: 'Settings category' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved category settings',
      content: {
        'application/json': {
          schema: z.record(z.any()).openapi({ description: 'Category settings' }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// PUT /api/v1/widget/{siteId}/settings/reset
registry.registerPath({
  method: 'put',
  path: '/api/v1/widget/{siteId}/settings/reset',
  summary: 'Reset widget settings to defaults',
  tags: ['Widget'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      siteId: z.string().openapi({ description: 'Site ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Settings reset successfully',
      content: {
        'application/json': {
          schema: widgetSettingsSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Site not found',
    },
  },
});

// Type exports
export type ErrorResponse = z.infer<typeof errorSchema>;
export type StartersResponse = z.infer<typeof startersResponseSchema>;
export type SiteConfigResponse = z.infer<typeof siteConfigResponseSchema>;
export type ValidateSiteResponse = z.infer<typeof validateSiteResponseSchema>;
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;
