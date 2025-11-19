import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IntelligentConvo API',
      version: '1.0.0',
      description: 'A comprehensive API for IntelligentConvo - an AI-powered conversation platform that provides intelligent chatbot solutions for websites',
      contact: {
        name: 'API Support',
        email: 'support@intelligentconvo.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: process.env.PRODUCTION_API_URL || 'https://api.intelligentconvo.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        googleOAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/api/auth/google',
              tokenUrl: '/api/auth/google/callback',
              scopes: {
                'profile email': 'Access profile and email',
              },
            },
          },
        },
        githubOAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/api/auth/github',
              tokenUrl: '/api/auth/github/callback',
              scopes: {
                'user:email': 'Access user email',
              },
            },
          },
        },
      },
      schemas: {
        // ===========================================
        // ENUMS
        // ===========================================
        AuthProvider: {
          type: 'string',
          enum: ['GOOGLE', 'GITHUB', 'MICROSOFT', 'EMAIL'],
          description: 'Authentication provider',
        },
        SubscriptionStatus: {
          type: 'string',
          enum: ['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED'],
          description: 'Subscription status',
        },
        PlanType: {
          type: 'string',
          enum: ['PREMIUM_MONTHLY', 'PREMIUM_ANNUAL'],
          description: 'Subscription plan type',
        },
        CrawlStatus: {
          type: 'string',
          enum: ['PENDING', 'CRAWLING', 'COMPLETED', 'FAILED'],
          description: 'Site crawling status',
        },
        ConversationRole: {
          type: 'string',
          enum: ['USER', 'ASSISTANT'],
          description: 'Message sender role',
        },

        // ===========================================
        // CORE MODELS
        // ===========================================
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the error occurred',
            },
          },
          required: ['error', 'statusCode'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            fullName: {
              type: 'string',
              description: 'User full name',
              nullable: true,
            },
            authProvider: {
              $ref: '#/components/schemas/AuthProvider',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              nullable: true,
            },
          },
          required: ['id', 'email', 'authProvider', 'createdAt', 'updatedAt'],
        },
        Site: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Site unique identifier',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Owner user ID',
            },
            siteUrl: {
              type: 'string',
              description: 'Website URL (normalized)',
            },
            siteName: {
              type: 'string',
              description: 'Website name',
            },
            siteDescription: {
              type: 'string',
              description: 'Website description',
              nullable: true,
            },
            siteIndustry: {
              type: 'string',
              description: 'Website industry/category',
              nullable: true,
            },
            specialInstructions: {
              type: 'string',
              description: 'Special instructions for the AI chatbot',
              nullable: true,
            },
            welcomeMessage: {
              type: 'string',
              description: 'Welcome message for visitors',
              default: 'Welcome! How can I help you today?',
            },
            crawlStatus: {
              $ref: '#/components/schemas/CrawlStatus',
            },
            lastCrawledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last crawl timestamp',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Site creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'userId', 'siteUrl', 'siteName', 'crawlStatus', 'createdAt', 'updatedAt'],
        },
        SiteWithCounts: {
          allOf: [
            { $ref: '#/components/schemas/Site' },
            {
              type: 'object',
              properties: {
                urlCount: {
                  type: 'integer',
                  description: 'Number of URLs for this site',
                },
                subscription: {
                  $ref: '#/components/schemas/SubscriptionSummary',
                },
                _count: {
                  type: 'object',
                  properties: {
                    urls: { type: 'integer' },
                    conversations: { type: 'integer' },
                    knowledgeFiles: { type: 'integer' },
                  },
                },
              },
            },
          ],
        },
        SiteUrl: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'URL unique identifier',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated site ID',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'The crawled URL',
            },
            title: {
              type: 'string',
              description: 'Page title',
              nullable: true,
            },
            content: {
              type: 'string',
              description: 'Extracted page content',
              nullable: true,
            },
            htmlContent: {
              type: 'string',
              description: 'Cleaned HTML for rich preview',
              nullable: true,
            },
            isActive: {
              type: 'boolean',
              description: 'Whether URL is active',
              default: true,
            },
            isExcluded: {
              type: 'boolean',
              description: 'Whether URL is excluded from training',
              default: false,
            },
            lastCrawledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last crawl timestamp',
              nullable: true,
            },
            contentHash: {
              type: 'string',
              description: 'Hash of content for change detection',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'URL creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'siteId', 'url', 'isActive', 'isExcluded', 'createdAt', 'updatedAt'],
        },
        Conversation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Conversation unique identifier',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated site ID',
            },
            sessionId: {
              type: 'string',
              description: 'Session identifier',
            },
            userIdentifier: {
              type: 'string',
              description: 'User identifier (can be anonymous)',
              nullable: true,
            },
            userAgent: {
              type: 'string',
              description: 'User agent string',
              nullable: true,
            },
            ipAddress: {
              type: 'string',
              description: 'User IP address',
              nullable: true,
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Conversation start timestamp',
            },
            lastMessageAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last message timestamp',
            },
            messageCount: {
              type: 'integer',
              description: 'Number of messages',
              default: 0,
            },
          },
          required: ['id', 'siteId', 'sessionId', 'startedAt', 'lastMessageAt', 'messageCount'],
        },
        ConversationWithMessages: {
          allOf: [
            { $ref: '#/components/schemas/Conversation' },
            {
              type: 'object',
              properties: {
                messages: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Message' },
                },
                site: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    siteName: { type: 'string' },
                    siteUrl: { type: 'string' },
                  },
                },
              },
            },
          ],
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Message unique identifier',
            },
            conversationId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated conversation ID',
            },
            role: {
              $ref: '#/components/schemas/ConversationRole',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Message timestamp',
            },
            tokensUsed: {
              type: 'integer',
              description: 'Number of tokens used',
              nullable: true,
            },
            costInCents: {
              type: 'number',
              description: 'Cost in cents',
              nullable: true,
            },
          },
          required: ['id', 'conversationId', 'role', 'content', 'timestamp'],
        },
        ConversationStarter: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Starter unique identifier',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated site ID',
            },
            starterText: {
              type: 'string',
              description: 'Conversation starter text',
            },
            orderIndex: {
              type: 'integer',
              description: 'Display order index',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether starter is active',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'siteId', 'starterText', 'orderIndex', 'isActive'],
        },
        ActiveHost: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Host unique identifier',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated site ID',
            },
            hostName: {
              type: 'string',
              description: 'Hostname (e.g., example.com)',
            },
            isEnabled: {
              type: 'boolean',
              description: 'Whether host is enabled',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'siteId', 'hostName', 'isEnabled', 'createdAt', 'updatedAt'],
        },
        KnowledgeFile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'File unique identifier',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated site ID',
            },
            fileName: {
              type: 'string',
              description: 'Original file name',
            },
            fileType: {
              type: 'string',
              description: 'MIME type of the file',
            },
            fileSize: {
              type: 'integer',
              format: 'int64',
              description: 'File size in bytes',
            },
            fileUrl: {
              type: 'string',
              description: 'URL to access the file',
            },
            processed: {
              type: 'boolean',
              description: 'Whether file has been processed',
              default: false,
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp',
            },
            processedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Processing completion timestamp',
              nullable: true,
            },
          },
          required: ['id', 'siteId', 'fileName', 'fileType', 'fileSize', 'fileUrl', 'processed', 'uploadedAt'],
        },

        // ===========================================
        // SUBSCRIPTION & BILLING
        // ===========================================
        Subscription: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Subscription unique identifier',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated user ID',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated site ID',
            },
            planType: {
              $ref: '#/components/schemas/PlanType',
            },
            status: {
              $ref: '#/components/schemas/SubscriptionStatus',
            },
            trialEndsAt: {
              type: 'string',
              format: 'date-time',
              description: 'Trial end date',
              nullable: true,
            },
            currentPeriodStart: {
              type: 'string',
              format: 'date-time',
              description: 'Current billing period start',
            },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Current billing period end',
            },
            stripeSubscriptionId: {
              type: 'string',
              description: 'Stripe subscription ID',
              nullable: true,
            },
            stripePriceId: {
              type: 'string',
              description: 'Stripe price ID',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            cancelledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
          required: ['id', 'userId', 'siteId', 'planType', 'status', 'currentPeriodStart', 'currentPeriodEnd', 'createdAt', 'updatedAt'],
        },
        SubscriptionSummary: {
          type: 'object',
          properties: {
            status: {
              $ref: '#/components/schemas/SubscriptionStatus',
            },
            planType: {
              $ref: '#/components/schemas/PlanType',
            },
            trialEndsAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        BillingInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            fullName: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            addressLine1: {
              type: 'string',
            },
            addressLine2: {
              type: 'string',
              nullable: true,
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
            country: {
              type: 'string',
            },
            postalCode: {
              type: 'string',
            },
            stripeCustomerId: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'userId', 'fullName', 'email', 'addressLine1', 'city', 'state', 'country', 'postalCode'],
        },
        BillingTransaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            siteId: {
              type: 'string',
              format: 'uuid',
            },
            invoiceId: {
              type: 'string',
            },
            amount: {
              type: 'number',
            },
            currency: {
              type: 'string',
              default: 'USD',
            },
            status: {
              type: 'string',
              enum: ['paid', 'pending', 'failed'],
            },
            stripeInvoiceId: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['id', 'userId', 'siteId', 'invoiceId', 'amount', 'currency', 'status', 'createdAt'],
        },

        // ===========================================
        // AUTHENTICATION
        // ===========================================
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
          required: ['accessToken', 'refreshToken', 'user'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 1,
            },
          },
          required: ['email', 'password'],
        },
        SignupRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 8,
            },
            fullName: {
              type: 'string',
            },
          },
          required: ['email', 'password'],
        },

        // ===========================================
        // WIDGET SETTINGS
        // ===========================================
        WidgetSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            siteId: { type: 'string', format: 'uuid' },

            // Appearance & Branding
            primaryColor: { type: 'string', default: '#6366f1' },
            secondaryColor: { type: 'string', default: '#818cf8' },
            backgroundColor: { type: 'string', default: '#ffffff' },
            textColor: { type: 'string', default: '#1e293b' },
            textSecondaryColor: { type: 'string', default: '#64748b' },
            borderColor: { type: 'string', default: '#e2e8f0' },

            // Typography
            fontFamily: { type: 'string', default: 'system' },
            fontSize: { type: 'integer', default: 14 },
            fontWeightNormal: { type: 'integer', default: 400 },
            fontWeightMedium: { type: 'integer', default: 500 },
            fontWeightBold: { type: 'integer', default: 600 },

            // Shapes & Borders
            borderRadius: { type: 'integer', default: 16 },
            borderRadiusSmall: { type: 'integer', default: 12 },
            borderRadiusButton: { type: 'integer', default: 8 },
            borderWidth: { type: 'integer', default: 1 },

            // Shadows
            shadowColor: { type: 'string', default: 'rgba(0, 0, 0, 0.1)' },
            shadowSize: { type: 'string', enum: ['none', 'small', 'medium', 'large'], default: 'medium' },

            // Launcher Button
            launcherIcon: { type: 'string', enum: ['chat', 'message', 'help', 'support', 'custom'], default: 'chat' },
            launcherCustomIconUrl: { type: 'string', nullable: true },
            launcherSize: { type: 'string', enum: ['small', 'medium', 'large'], default: 'medium' },
            launcherPosition: { type: 'string', enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'], default: 'bottom-right' },
            launcherOffsetX: { type: 'integer', default: 20 },
            launcherOffsetY: { type: 'integer', default: 20 },
            launcherShape: { type: 'string', enum: ['circle', 'rounded-square', 'square'], default: 'circle' },
            launcherBackgroundColor: { type: 'string', nullable: true },
            launcherIconColor: { type: 'string', default: '#ffffff' },
            launcherBorderColor: { type: 'string', nullable: true },
            launcherBorderWidth: { type: 'integer', default: 0 },
            launcherText: { type: 'string', nullable: true },
            launcherTooltip: { type: 'string', default: 'Chat with us' },
            launcherShowTooltip: { type: 'boolean', default: true },
            launcherShowBadge: { type: 'boolean', default: false },
            launcherBadgeColor: { type: 'string', default: '#ef4444' },
            launcherBadgeTextColor: { type: 'string', default: '#ffffff' },
            launcherAnimation: { type: 'string', enum: ['none', 'pulse', 'bounce', 'shake', 'glow'], default: 'pulse' },
            launcherAnimationDelay: { type: 'integer', default: 3000 },

            // Chat Window
            chatWindowWidth: { type: 'integer', default: 400 },
            chatWindowHeight: { type: 'integer', default: 600 },
            chatWindowMaxHeight: { type: 'string', default: '90vh' },
            chatWindowZIndex: { type: 'integer', default: 999998 },

            // Header
            headerBackgroundColor: { type: 'string', nullable: true },
            headerTextColor: { type: 'string', default: '#ffffff' },
            headerHeight: { type: 'integer', default: 60 },
            headerTitle: { type: 'string', default: 'Chat Assistant' },
            headerSubtitle: { type: 'string', nullable: true },
            headerShowAvatar: { type: 'boolean', default: true },
            headerAvatarUrl: { type: 'string', nullable: true },
            headerShowStatus: { type: 'boolean', default: true },
            headerShowCloseButton: { type: 'boolean', default: true },
            headerShowMinimizeButton: { type: 'boolean', default: false },

            // Message Area
            messageAreaBackgroundColor: { type: 'string', nullable: true },
            messageAreaPadding: { type: 'integer', default: 16 },

            // User Bubbles
            userBubbleBackgroundColor: { type: 'string', nullable: true },
            userBubbleTextColor: { type: 'string', default: '#ffffff' },
            userBubbleBorderRadius: { type: 'integer', default: 16 },
            userBubbleAlignment: { type: 'string', default: 'right' },

            // Assistant Bubbles
            assistantBubbleBackgroundColor: { type: 'string', default: '#f1f5f9' },
            assistantBubbleTextColor: { type: 'string', default: '#1e293b' },
            assistantBubbleBorderRadius: { type: 'integer', default: 16 },
            assistantBubbleAlignment: { type: 'string', default: 'left' },

            // Message Styling
            messageMaxWidth: { type: 'string', default: '80%' },
            messageFontSize: { type: 'integer', default: 14 },
            messageLineHeight: { type: 'number', default: 1.5 },
            messageTimestampShow: { type: 'boolean', default: true },
            messageTimestampFormat: { type: 'string', default: 'HH:mm' },

            // Avatar in Messages
            showMessageAvatar: { type: 'boolean', default: true },
            botAvatarUrl: { type: 'string', nullable: true },
            botAvatarFallback: { type: 'string', default: 'AI' },

            // Input Area
            inputBackgroundColor: { type: 'string', default: '#ffffff' },
            inputTextColor: { type: 'string', default: '#1e293b' },
            inputBorderColor: { type: 'string', default: '#e2e8f0' },
            inputBorderRadius: { type: 'integer', default: 24 },
            inputPlaceholder: { type: 'string', default: 'Type your message...' },
            inputMinHeight: { type: 'integer', default: 44 },
            inputMaxHeight: { type: 'integer', default: 120 },

            // Send Button
            sendButtonBackgroundColor: { type: 'string', nullable: true },
            sendButtonIconColor: { type: 'string', default: '#ffffff' },
            sendButtonShape: { type: 'string', enum: ['circle', 'rounded-square', 'square'], default: 'circle' },

            // Behavior
            autoOpenEnabled: { type: 'boolean', default: false },
            autoOpenDelay: { type: 'integer', default: 5000 },
            autoOpenOnlyOnce: { type: 'boolean', default: true },
            autoOpenOnMobile: { type: 'boolean', default: false },
            showTypingIndicator: { type: 'boolean', default: true },
            typingIndicatorStyle: { type: 'string', enum: ['dots', 'text', 'pulse'], default: 'dots' },
            typingIndicatorText: { type: 'string', default: 'Assistant is typing...' },
            showReadReceipts: { type: 'boolean', default: false },
            enableSoundNotifications: { type: 'boolean', default: false },
            soundNotificationUrl: { type: 'string', nullable: true },
            soundVolume: { type: 'number', default: 0.5 },
            enableDesktopNotifications: { type: 'boolean', default: false },
            enableVoiceInput: { type: 'boolean', default: true },
            voiceInputLanguage: { type: 'string', default: 'en-US' },
            enableFileAttachments: { type: 'boolean', default: false },
            allowedFileTypes: { type: 'array', items: { type: 'string' }, default: ['image/*', 'application/pdf'] },
            maxFileSizeMB: { type: 'integer', default: 5 },
            maxFilesPerMessage: { type: 'integer', default: 3 },
            enableEmojiPicker: { type: 'boolean', default: true },
            persistConversation: { type: 'boolean', default: true },
            conversationTimeout: { type: 'integer', default: 1800 },
            maxMessagesHistory: { type: 'integer', default: 100 },
            showQuickReplies: { type: 'boolean', default: true },
            quickRepliesPosition: { type: 'string', enum: ['above-input', 'below-header'], default: 'above-input' },

            // Content
            botName: { type: 'string', default: 'Assistant' },
            botTagline: { type: 'string', nullable: true },
            welcomeMessage: { type: 'string', default: 'Hello! How can I help you today?' },
            offlineMessage: { type: 'string', default: "We're currently offline. Please leave a message and we'll get back to you." },
            errorMessage: { type: 'string', default: 'Something went wrong. Please try again.' },
            reconnectingMessage: { type: 'string', default: 'Reconnecting...' },
            inputPlaceholderText: { type: 'string', default: 'Type your message...' },
            sendButtonAriaLabel: { type: 'string', default: 'Send message' },
            closeButtonAriaLabel: { type: 'string', default: 'Close chat' },
            minimizeButtonAriaLabel: { type: 'string', default: 'Minimize chat' },
            showConversationStarters: { type: 'boolean', default: true },
            startersTitle: { type: 'string', default: 'Suggested questions' },
            showPoweredBy: { type: 'boolean', default: true },
            poweredByText: { type: 'string', default: 'Powered by Intelligentconvo' },
            poweredByUrl: { type: 'string', default: 'https://intelligentconvo.com' },

            // Responsive
            mobileBreakpoint: { type: 'integer', default: 768 },
            tabletBreakpoint: { type: 'integer', default: 1024 },
            mobileFullScreen: { type: 'boolean', default: true },
            mobileChatWindowWidth: { type: 'string', default: '100%' },
            mobileChatWindowHeight: { type: 'string', default: '100%' },
            mobileHeaderHeight: { type: 'integer', default: 56 },
            mobileFontSize: { type: 'integer', default: 16 },
            mobileInputMinHeight: { type: 'integer', default: 48 },
            mobileLauncherSize: { type: 'string', default: 'medium' },
            mobileLauncherOffsetX: { type: 'integer', default: 16 },
            mobileLauncherOffsetY: { type: 'integer', default: 16 },
            mobileMessageMaxWidth: { type: 'string', default: '85%' },
            mobileShowMinimizeButton: { type: 'boolean', default: false },
            tabletChatWindowWidth: { type: 'integer', default: 380 },
            tabletChatWindowHeight: { type: 'integer', default: 550 },
            tabletFontSize: { type: 'integer', default: 15 },
            enableTouchOptimizations: { type: 'boolean', default: true },
            touchTargetMinSize: { type: 'integer', default: 44 },
            adjustForKeyboard: { type: 'boolean', default: true },
            keyboardPaddingBottom: { type: 'integer', default: 0 },

            // Advanced
            enableAnimations: { type: 'boolean', default: true },
            animationDuration: { type: 'integer', default: 200 },
            animationEasing: { type: 'string', default: 'ease-out' },
            enableHighContrast: { type: 'boolean', default: false },
            respectReducedMotion: { type: 'boolean', default: true },
            enableKeyboardNavigation: { type: 'boolean', default: true },
            focusRingColor: { type: 'string', default: '#6366f1' },
            focusRingWidth: { type: 'integer', default: 2 },
            theme: { type: 'string', enum: ['light', 'dark', 'auto'], default: 'light' },
            darkModeBackgroundColor: { type: 'string', default: '#1e293b' },
            darkModeTextColor: { type: 'string', default: '#f8fafc' },
            darkModeBorderColor: { type: 'string', default: '#334155' },
            customCss: { type: 'string', nullable: true },
            lazyLoadMessages: { type: 'boolean', default: true },
            preloadWidget: { type: 'boolean', default: false },
            sanitizeHtml: { type: 'boolean', default: true },
            allowedHtmlTags: { type: 'array', items: { type: 'string' }, default: ['b', 'i', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'] },
            enableAnalytics: { type: 'boolean', default: true },
            trackMessageEvents: { type: 'boolean', default: true },
            trackUserInteractions: { type: 'boolean', default: true },

            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'siteId'],
        },

        // ===========================================
        // REQUEST/RESPONSE SCHEMAS
        // ===========================================
        CreateSiteRequest: {
          type: 'object',
          properties: {
            siteUrl: {
              type: 'string',
              format: 'uri',
              description: 'Website URL to crawl',
            },
            siteName: {
              type: 'string',
              description: 'Optional site name',
            },
            siteDescription: {
              type: 'string',
              description: 'Optional site description',
            },
            siteIndustry: {
              type: 'string',
              description: 'Optional site industry',
            },
          },
          required: ['siteUrl'],
        },
        UpdateSiteRequest: {
          type: 'object',
          properties: {
            siteName: { type: 'string' },
            siteDescription: { type: 'string' },
            siteIndustry: { type: 'string' },
            specialInstructions: { type: 'string' },
            welcomeMessage: { type: 'string' },
          },
        },
        UpdateStartersRequest: {
          type: 'object',
          properties: {
            welcomeMessage: {
              type: 'string',
              nullable: true,
            },
            starters: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        StartersResponse: {
          type: 'object',
          properties: {
            welcomeMessage: {
              type: 'string',
              nullable: true,
            },
            starters: {
              type: 'array',
              items: { $ref: '#/components/schemas/ConversationStarter' },
            },
          },
        },
        HostsResponse: {
          type: 'object',
          properties: {
            hosts: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActiveHost' },
            },
          },
        },
        AddHostRequest: {
          type: 'object',
          properties: {
            hostName: {
              type: 'string',
              description: 'Hostname (e.g., example.com)',
            },
            isEnabled: {
              type: 'boolean',
              default: true,
            },
          },
          required: ['hostName'],
        },
        ConversationAnalytics: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalConversations: { type: 'integer' },
                totalMessages: { type: 'integer' },
                averageMessagesPerConversation: { type: 'number' },
                activeUsers: { type: 'integer' },
              },
            },
            timeSeriesData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  conversations: { type: 'integer' },
                  messages: { type: 'integer' },
                },
              },
            },
            topSites: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  siteId: { type: 'string' },
                  siteName: { type: 'string' },
                  conversationCount: { type: 'integer' },
                  messageCount: { type: 'integer' },
                },
              },
            },
          },
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
        MessageResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
        ValidateSiteResponse: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            siteName: { type: 'string' },
            status: { $ref: '#/components/schemas/SubscriptionStatus' },
          },
        },
        SiteConfigResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            siteName: { type: 'string' },
            welcomeMessage: { type: 'string' },
            conversationStarters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  starterText: { type: 'string' },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Unauthorized',
                statusCode: 401,
                timestamp: '2023-12-07T10:30:00.000Z',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Forbidden',
                statusCode: 403,
                timestamp: '2023-12-07T10:30:00.000Z',
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Resource not found',
                statusCode: 404,
                timestamp: '2023-12-07T10:30:00.000Z',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error - invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation failed',
                statusCode: 400,
                timestamp: '2023-12-07T10:30:00.000Z',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Internal server error',
                statusCode: 500,
                timestamp: '2023-12-07T10:30:00.000Z',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization operations',
      },
      {
        name: 'Sites',
        description: 'Website management operations',
      },
      {
        name: 'URLs',
        description: 'URL crawling and content management operations',
      },
      {
        name: 'Files',
        description: 'Knowledge file upload and management operations',
      },
      {
        name: 'Conversations',
        description: 'Chat conversation management operations',
      },
      {
        name: 'Subscriptions',
        description: 'User subscription and billing operations',
      },
      {
        name: 'Widget',
        description: 'Chat widget configuration and public endpoints',
      },
      {
        name: 'Account',
        description: 'User account management operations',
      },
      {
        name: 'Billing',
        description: 'Billing information and transaction operations',
      },
      {
        name: 'Webhooks',
        description: 'External webhook operations',
      },
      {
        name: 'Health',
        description: 'System health check operations',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './src/index.ts',
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'IntelligentConvo API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // Also serve the JSON spec at /api/docs.json
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export { specs };
