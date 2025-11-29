-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'GITHUB', 'MICROSOFT', 'EMAIL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PREMIUM_MONTHLY', 'PREMIUM_ANNUAL');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('PENDING', 'CRAWLING', 'PAUSED', 'COMPLETED', 'FAILED', 'AWAITING_PAYMENT', 'PROCESSING', 'READY', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DiscoveryStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UrlEmbeddingStatus" AS ENUM ('SCRAPING', 'SCRAPED', 'PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('GENERAL', 'AUTHENTICATION', 'SECURITY', 'AI_MODELS', 'AI_OPTIMIZATION', 'RATE_LIMIT', 'EMAIL', 'BILLING', 'STORAGE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'FORCE_LOGOUT', 'EXTEND_TRIAL', 'RECRAWL', 'REPROCESS', 'CLEANUP', 'EXPORT', 'BULK_UPDATE', 'BULK_DELETE');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'SITE', 'URL', 'EMBEDDING', 'FILE', 'CONVERSATION', 'MESSAGE', 'SUBSCRIPTION', 'TRANSACTION', 'SESSION', 'WIDGET', 'BILLING_INFO');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WELCOME', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'SUBSCRIPTION_ACTIVATED', 'TRIAL_EXPIRING', 'TRIAL_EXPIRED', 'PAYMENT_FAILED', 'PAYMENT_RECEIPT', 'SITE_READY', 'SUBSCRIPTION_CANCELLED', 'SITE_DELETED', 'REFUND_CONFIRMATION', 'DISPUTE_ALERT');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'FAILED', 'BOUNCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "authProvider" "AuthProvider" NOT NULL,
    "authProviderId" TEXT,
    "passwordHash" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "forceLogoutAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpiresAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "faviconUrl" TEXT,
    "siteDescription" TEXT,
    "siteIndustry" TEXT,
    "specialInstructions" TEXT,
    "startersHeadline" TEXT NOT NULL DEFAULT 'Welcome! How can I help you today?',
    "crawlStatus" "CrawlStatus" NOT NULL DEFAULT 'PENDING',
    "lastCrawledAt" TIMESTAMP(3),
    "discoveryStatus" "DiscoveryStatus" NOT NULL DEFAULT 'PENDING',
    "discoveredAt" TIMESTAMP(3),
    "sitemapUrl" TEXT,
    "totalDiscoveredUrls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "secondaryColor" TEXT NOT NULL DEFAULT '#818cf8',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "textColor" TEXT NOT NULL DEFAULT '#1e293b',
    "textSecondaryColor" TEXT NOT NULL DEFAULT '#64748b',
    "borderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
    "fontFamily" TEXT NOT NULL DEFAULT 'system',
    "fontSize" INTEGER NOT NULL DEFAULT 14,
    "fontWeightNormal" INTEGER NOT NULL DEFAULT 400,
    "fontWeightMedium" INTEGER NOT NULL DEFAULT 500,
    "fontWeightBold" INTEGER NOT NULL DEFAULT 600,
    "borderRadius" INTEGER NOT NULL DEFAULT 16,
    "borderRadiusSmall" INTEGER NOT NULL DEFAULT 12,
    "borderRadiusButton" INTEGER NOT NULL DEFAULT 8,
    "borderWidth" INTEGER NOT NULL DEFAULT 1,
    "shadowColor" TEXT NOT NULL DEFAULT 'rgba(0, 0, 0, 0.1)',
    "shadowSize" TEXT NOT NULL DEFAULT 'medium',
    "launcherIcon" TEXT NOT NULL DEFAULT 'chat',
    "launcherCustomIconUrl" TEXT,
    "launcherSize" TEXT NOT NULL DEFAULT 'medium',
    "launcherPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "launcherOffsetX" INTEGER NOT NULL DEFAULT 20,
    "launcherOffsetY" INTEGER NOT NULL DEFAULT 20,
    "launcherShape" TEXT NOT NULL DEFAULT 'circle',
    "launcherBackgroundColor" TEXT,
    "launcherIconColor" TEXT NOT NULL DEFAULT '#ffffff',
    "launcherBorderColor" TEXT,
    "launcherBorderWidth" INTEGER NOT NULL DEFAULT 0,
    "launcherText" TEXT,
    "launcherTooltip" TEXT NOT NULL DEFAULT 'Chat with us',
    "launcherShowTooltip" BOOLEAN NOT NULL DEFAULT true,
    "launcherShowBadge" BOOLEAN NOT NULL DEFAULT false,
    "launcherBadgeColor" TEXT NOT NULL DEFAULT '#ef4444',
    "launcherBadgeTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "launcherAnimation" TEXT NOT NULL DEFAULT 'pulse',
    "launcherAnimationDelay" INTEGER NOT NULL DEFAULT 3000,
    "chatWindowWidth" INTEGER NOT NULL DEFAULT 400,
    "chatWindowHeight" INTEGER NOT NULL DEFAULT 600,
    "chatWindowMaxHeight" TEXT NOT NULL DEFAULT '90vh',
    "chatWindowZIndex" INTEGER NOT NULL DEFAULT 999998,
    "headerBackgroundColor" TEXT,
    "headerTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "headerHeight" INTEGER NOT NULL DEFAULT 60,
    "headerTitle" TEXT NOT NULL DEFAULT 'Chat Assistant',
    "headerSubtitle" TEXT,
    "headerShowAvatar" BOOLEAN NOT NULL DEFAULT true,
    "headerAvatarUrl" TEXT,
    "headerShowStatus" BOOLEAN NOT NULL DEFAULT true,
    "headerShowCloseButton" BOOLEAN NOT NULL DEFAULT true,
    "headerShowMinimizeButton" BOOLEAN NOT NULL DEFAULT false,
    "messageAreaBackgroundColor" TEXT,
    "messageAreaPadding" INTEGER NOT NULL DEFAULT 16,
    "userBubbleBackgroundColor" TEXT,
    "userBubbleTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "userBubbleBorderRadius" INTEGER NOT NULL DEFAULT 16,
    "userBubbleAlignment" TEXT NOT NULL DEFAULT 'right',
    "assistantBubbleBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "assistantBubbleTextColor" TEXT NOT NULL DEFAULT '#1e293b',
    "assistantBubbleBorderRadius" INTEGER NOT NULL DEFAULT 16,
    "assistantBubbleAlignment" TEXT NOT NULL DEFAULT 'left',
    "messageMaxWidth" TEXT NOT NULL DEFAULT '80%',
    "messageFontSize" INTEGER NOT NULL DEFAULT 14,
    "messageLineHeight" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "messageTimestampShow" BOOLEAN NOT NULL DEFAULT true,
    "messageTimestampFormat" TEXT NOT NULL DEFAULT 'HH:mm',
    "showMessageAvatar" BOOLEAN NOT NULL DEFAULT true,
    "botAvatarUrl" TEXT,
    "botAvatarFallback" TEXT NOT NULL DEFAULT 'AI',
    "inputBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "inputTextColor" TEXT NOT NULL DEFAULT '#1e293b',
    "inputBorderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
    "inputBorderRadius" INTEGER NOT NULL DEFAULT 24,
    "inputPlaceholder" TEXT NOT NULL DEFAULT 'Type your message...',
    "inputMinHeight" INTEGER NOT NULL DEFAULT 44,
    "inputMaxHeight" INTEGER NOT NULL DEFAULT 120,
    "sendButtonBackgroundColor" TEXT,
    "sendButtonIconColor" TEXT NOT NULL DEFAULT '#ffffff',
    "sendButtonShape" TEXT NOT NULL DEFAULT 'circle',
    "autoOpenEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoOpenDelay" INTEGER NOT NULL DEFAULT 5000,
    "autoOpenOnlyOnce" BOOLEAN NOT NULL DEFAULT true,
    "autoOpenOnMobile" BOOLEAN NOT NULL DEFAULT false,
    "showTypingIndicator" BOOLEAN NOT NULL DEFAULT true,
    "typingIndicatorStyle" TEXT NOT NULL DEFAULT 'dots',
    "typingIndicatorText" TEXT NOT NULL DEFAULT 'Assistant is typing...',
    "showReadReceipts" BOOLEAN NOT NULL DEFAULT false,
    "enableSoundNotifications" BOOLEAN NOT NULL DEFAULT false,
    "soundNotificationUrl" TEXT,
    "soundVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "enableDesktopNotifications" BOOLEAN NOT NULL DEFAULT false,
    "enableVoiceInput" BOOLEAN NOT NULL DEFAULT true,
    "voiceInputLanguage" TEXT NOT NULL DEFAULT 'en-US',
    "enableFileAttachments" BOOLEAN NOT NULL DEFAULT false,
    "allowedFileTypes" TEXT[] DEFAULT ARRAY['image/*', 'application/pdf']::TEXT[],
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 5,
    "maxFilesPerMessage" INTEGER NOT NULL DEFAULT 3,
    "enableEmojiPicker" BOOLEAN NOT NULL DEFAULT true,
    "persistConversation" BOOLEAN NOT NULL DEFAULT true,
    "conversationTimeout" INTEGER NOT NULL DEFAULT 1800,
    "maxMessagesHistory" INTEGER NOT NULL DEFAULT 100,
    "showQuickReplies" BOOLEAN NOT NULL DEFAULT true,
    "quickRepliesPosition" TEXT NOT NULL DEFAULT 'above-input',
    "botName" TEXT NOT NULL DEFAULT 'Assistant',
    "botTagline" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
    "offlineMessage" TEXT NOT NULL DEFAULT 'We''re currently offline. Please leave a message and we''ll get back to you.',
    "errorMessage" TEXT NOT NULL DEFAULT 'Something went wrong. Please try again.',
    "reconnectingMessage" TEXT NOT NULL DEFAULT 'Reconnecting...',
    "inputPlaceholderText" TEXT NOT NULL DEFAULT 'Type your message...',
    "sendButtonAriaLabel" TEXT NOT NULL DEFAULT 'Send message',
    "closeButtonAriaLabel" TEXT NOT NULL DEFAULT 'Close chat',
    "minimizeButtonAriaLabel" TEXT NOT NULL DEFAULT 'Minimize chat',
    "showConversationStarters" BOOLEAN NOT NULL DEFAULT true,
    "startersTitle" TEXT NOT NULL DEFAULT 'Suggested questions',
    "showPoweredBy" BOOLEAN NOT NULL DEFAULT false,
    "poweredByText" TEXT NOT NULL DEFAULT 'Powered by IntelliConvo',
    "poweredByUrl" TEXT NOT NULL DEFAULT 'https://intelliconvo.com',
    "mobileBreakpoint" INTEGER NOT NULL DEFAULT 768,
    "tabletBreakpoint" INTEGER NOT NULL DEFAULT 1024,
    "mobileFullScreen" BOOLEAN NOT NULL DEFAULT true,
    "mobileChatWindowWidth" TEXT NOT NULL DEFAULT '100%',
    "mobileChatWindowHeight" TEXT NOT NULL DEFAULT '100%',
    "mobileHeaderHeight" INTEGER NOT NULL DEFAULT 56,
    "mobileFontSize" INTEGER NOT NULL DEFAULT 16,
    "mobileInputMinHeight" INTEGER NOT NULL DEFAULT 48,
    "mobileLauncherSize" TEXT NOT NULL DEFAULT 'medium',
    "mobileLauncherOffsetX" INTEGER NOT NULL DEFAULT 16,
    "mobileLauncherOffsetY" INTEGER NOT NULL DEFAULT 16,
    "mobileMessageMaxWidth" TEXT NOT NULL DEFAULT '85%',
    "mobileShowMinimizeButton" BOOLEAN NOT NULL DEFAULT false,
    "tabletChatWindowWidth" INTEGER NOT NULL DEFAULT 380,
    "tabletChatWindowHeight" INTEGER NOT NULL DEFAULT 550,
    "tabletFontSize" INTEGER NOT NULL DEFAULT 15,
    "enableTouchOptimizations" BOOLEAN NOT NULL DEFAULT true,
    "touchTargetMinSize" INTEGER NOT NULL DEFAULT 44,
    "adjustForKeyboard" BOOLEAN NOT NULL DEFAULT true,
    "keyboardPaddingBottom" INTEGER NOT NULL DEFAULT 0,
    "enableAnimations" BOOLEAN NOT NULL DEFAULT true,
    "animationDuration" INTEGER NOT NULL DEFAULT 200,
    "animationEasing" TEXT NOT NULL DEFAULT 'ease-out',
    "enableHighContrast" BOOLEAN NOT NULL DEFAULT false,
    "respectReducedMotion" BOOLEAN NOT NULL DEFAULT true,
    "enableKeyboardNavigation" BOOLEAN NOT NULL DEFAULT true,
    "focusRingColor" TEXT NOT NULL DEFAULT '#6366f1',
    "focusRingWidth" INTEGER NOT NULL DEFAULT 2,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "darkModePrimaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "darkModeSecondaryColor" TEXT NOT NULL DEFAULT '#818cf8',
    "darkModeBackgroundColor" TEXT NOT NULL DEFAULT '#1e293b',
    "darkModeSecondaryBackgroundColor" TEXT NOT NULL DEFAULT '#374151',
    "darkModeTextColor" TEXT NOT NULL DEFAULT '#f1f5f9',
    "darkModeTextSecondaryColor" TEXT NOT NULL DEFAULT '#94a3b8',
    "darkModeBorderColor" TEXT NOT NULL DEFAULT '#475569',
    "customCss" TEXT,
    "lazyLoadMessages" BOOLEAN NOT NULL DEFAULT true,
    "preloadWidget" BOOLEAN NOT NULL DEFAULT false,
    "sanitizeHtml" BOOLEAN NOT NULL DEFAULT true,
    "allowedHtmlTags" TEXT[] DEFAULT ARRAY['b', 'i', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre']::TEXT[],
    "enableAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "trackMessageEvents" BOOLEAN NOT NULL DEFAULT true,
    "trackUserInteractions" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteUrl" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "htmlContent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "embeddingStatus" "UrlEmbeddingStatus" NOT NULL DEFAULT 'SCRAPED',
    "lastCrawledAt" TIMESTAMP(3),
    "contentHash" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UrlSelection" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UrlSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "siteUrlId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentChunk" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "vectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationStarter" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "starterText" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationStarter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userIdentifier" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokensUsed" INTEGER,
    "costInCents" DOUBLE PRECISION,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFile" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveHost" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "siteId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "category" "SettingCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "templateData" JSONB,
    "messageId" TEXT,
    "provider" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_authProvider_authProviderId_idx" ON "User"("authProvider", "authProviderId");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInfo_userId_key" ON "BillingInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInfo_stripeCustomerId_key" ON "BillingInfo"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Site_userId_idx" ON "Site"("userId");

-- CreateIndex
CREATE INDEX "Site_crawlStatus_idx" ON "Site"("crawlStatus");

-- CreateIndex
CREATE INDEX "Site_discoveryStatus_idx" ON "Site"("discoveryStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Site_userId_siteUrl_key" ON "Site"("userId", "siteUrl");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetSettings_siteId_key" ON "WidgetSettings"("siteId");

-- CreateIndex
CREATE INDEX "WidgetSettings_siteId_idx" ON "WidgetSettings"("siteId");

-- CreateIndex
CREATE INDEX "SiteUrl_siteId_idx" ON "SiteUrl"("siteId");

-- CreateIndex
CREATE INDEX "SiteUrl_isActive_isExcluded_idx" ON "SiteUrl"("isActive", "isExcluded");

-- CreateIndex
CREATE INDEX "SiteUrl_siteId_isActive_isExcluded_idx" ON "SiteUrl"("siteId", "isActive", "isExcluded");

-- CreateIndex
CREATE INDEX "SiteUrl_embeddingStatus_idx" ON "SiteUrl"("embeddingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUrl_siteId_url_key" ON "SiteUrl"("siteId", "url");

-- CreateIndex
CREATE INDEX "UrlSelection_siteId_idx" ON "UrlSelection"("siteId");

-- CreateIndex
CREATE INDEX "UrlSelection_siteId_selected_idx" ON "UrlSelection"("siteId", "selected");

-- CreateIndex
CREATE INDEX "UrlSelection_siteId_category_idx" ON "UrlSelection"("siteId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "UrlSelection_siteId_url_key" ON "UrlSelection"("siteId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_vectorId_key" ON "Embedding"("vectorId");

-- CreateIndex
CREATE INDEX "Embedding_siteUrlId_idx" ON "Embedding"("siteUrlId");

-- CreateIndex
CREATE INDEX "Embedding_vectorId_idx" ON "Embedding"("vectorId");

-- CreateIndex
CREATE INDEX "ConversationStarter_siteId_idx" ON "ConversationStarter"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationStarter_siteId_orderIndex_key" ON "ConversationStarter"("siteId", "orderIndex");

-- CreateIndex
CREATE INDEX "Conversation_siteId_idx" ON "Conversation"("siteId");

-- CreateIndex
CREATE INDEX "Conversation_sessionId_idx" ON "Conversation"("sessionId");

-- CreateIndex
CREATE INDEX "Conversation_startedAt_idx" ON "Conversation"("startedAt");

-- CreateIndex
CREATE INDEX "Conversation_siteId_lastMessageAt_idx" ON "Conversation"("siteId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_siteId_isTest_idx" ON "Conversation"("siteId", "isTest");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE INDEX "Message_conversationId_timestamp_idx" ON "Message"("conversationId", "timestamp");

-- CreateIndex
CREATE INDEX "KnowledgeFile_siteId_idx" ON "KnowledgeFile"("siteId");

-- CreateIndex
CREATE INDEX "KnowledgeFile_status_idx" ON "KnowledgeFile"("status");

-- CreateIndex
CREATE INDEX "ActiveHost_siteId_idx" ON "ActiveHost"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveHost_siteId_hostName_key" ON "ActiveHost"("siteId", "hostName");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_siteId_key" ON "Subscription"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingTransaction_invoiceId_key" ON "BillingTransaction"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingTransaction_stripeInvoiceId_key" ON "BillingTransaction"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "BillingTransaction_userId_idx" ON "BillingTransaction"("userId");

-- CreateIndex
CREATE INDEX "BillingTransaction_status_idx" ON "BillingTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_userId_idx" ON "EmailLog"("userId");

-- CreateIndex
CREATE INDEX "EmailLog_email_idx" ON "EmailLog"("email");

-- CreateIndex
CREATE INDEX "EmailLog_type_idx" ON "EmailLog"("type");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- AddForeignKey
ALTER TABLE "BillingInfo" ADD CONSTRAINT "BillingInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteUrl" ADD CONSTRAINT "SiteUrl_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UrlSelection" ADD CONSTRAINT "UrlSelection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_siteUrlId_fkey" FOREIGN KEY ("siteUrlId") REFERENCES "SiteUrl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationStarter" ADD CONSTRAINT "ConversationStarter_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFile" ADD CONSTRAINT "KnowledgeFile_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveHost" ADD CONSTRAINT "ActiveHost_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingTransaction" ADD CONSTRAINT "BillingTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
