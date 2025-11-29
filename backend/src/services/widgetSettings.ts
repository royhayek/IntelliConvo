import { prisma } from '../lib/prisma';
import { WidgetSettings, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { cacheService, CacheNamespace, CacheTTL } from './cache';

// Default widget settings (matches Prisma schema defaults)
export const defaultWidgetSettings: Omit<Prisma.WidgetSettingsCreateInput, 'site'> = {
  // Appearance & Branding
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  textSecondaryColor: '#64748b',
  borderColor: '#e2e8f0',
  fontFamily: 'system',
  fontSize: 14,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  borderRadius: 16,
  borderRadiusSmall: 12,
  borderRadiusButton: 8,
  borderWidth: 1,
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowSize: 'medium',

  // Launcher Button
  launcherIcon: 'chat',
  launcherSize: 'medium',
  launcherPosition: 'bottom-right',
  launcherOffsetX: 20,
  launcherOffsetY: 20,
  launcherShape: 'circle',
  launcherIconColor: '#ffffff',
  launcherBorderWidth: 0,
  launcherTooltip: 'Chat with us',
  launcherShowTooltip: true,
  launcherShowBadge: false,
  launcherBadgeColor: '#ef4444',
  launcherBadgeTextColor: '#ffffff',
  launcherAnimation: 'pulse',
  launcherAnimationDelay: 3000,

  // Chat Window
  chatWindowWidth: 400,
  chatWindowHeight: 600,
  chatWindowMaxHeight: '90vh',
  chatWindowZIndex: 999998,
  headerTextColor: '#ffffff',
  headerHeight: 60,
  headerTitle: 'Chat Assistant',
  headerShowAvatar: true,
  headerShowStatus: true,
  headerShowCloseButton: true,
  headerShowMinimizeButton: false,
  messageAreaPadding: 16,
  userBubbleTextColor: '#ffffff',
  userBubbleBorderRadius: 16,
  userBubbleAlignment: 'right',
  assistantBubbleBackgroundColor: '#f1f5f9',
  assistantBubbleTextColor: '#1e293b',
  assistantBubbleBorderRadius: 16,
  assistantBubbleAlignment: 'left',
  messageMaxWidth: '80%',
  messageFontSize: 14,
  messageLineHeight: 1.5,
  messageTimestampShow: true,
  messageTimestampFormat: 'HH:mm',
  showMessageAvatar: true,
  botAvatarFallback: 'AI',
  inputBackgroundColor: '#ffffff',
  inputTextColor: '#1e293b',
  inputBorderColor: '#e2e8f0',
  inputBorderRadius: 24,
  inputPlaceholder: 'Type your message...',
  inputMinHeight: 44,
  inputMaxHeight: 120,
  sendButtonIconColor: '#ffffff',
  sendButtonShape: 'circle',

  // Behavior & Features
  autoOpenEnabled: false,
  autoOpenDelay: 5000,
  autoOpenOnlyOnce: true,
  autoOpenOnMobile: false,
  showTypingIndicator: true,
  typingIndicatorStyle: 'dots',
  typingIndicatorText: 'Assistant is typing...',
  showReadReceipts: false,
  enableSoundNotifications: false,
  soundVolume: 0.5,
  enableDesktopNotifications: false,
  enableVoiceInput: true,
  voiceInputLanguage: 'en-US',
  enableFileAttachments: false,
  allowedFileTypes: ['image/*', 'application/pdf'],
  maxFileSizeMB: 5,
  maxFilesPerMessage: 3,
  enableEmojiPicker: true,
  persistConversation: true,
  conversationTimeout: 1800,
  maxMessagesHistory: 100,
  showQuickReplies: true,
  quickRepliesPosition: 'above-input',

  // Content & Text
  botName: 'Assistant',
  welcomeMessage: 'Hello! How can I help you today?',
  offlineMessage: "We're currently offline. Please leave a message and we'll get back to you.",
  errorMessage: 'Something went wrong. Please try again.',
  reconnectingMessage: 'Reconnecting...',
  inputPlaceholderText: 'Type your message...',
  sendButtonAriaLabel: 'Send message',
  closeButtonAriaLabel: 'Close chat',
  minimizeButtonAriaLabel: 'Minimize chat',
  showConversationStarters: true,
  startersTitle: 'Suggested questions',
  showPoweredBy: false,
  poweredByText: 'Powered by IntelliConvo',
  poweredByUrl: 'https://intelliconvo.com',

  // Responsive / Mobile
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  mobileFullScreen: true,
  mobileChatWindowWidth: '100%',
  mobileChatWindowHeight: '100%',
  mobileHeaderHeight: 56,
  mobileFontSize: 16,
  mobileInputMinHeight: 48,
  mobileLauncherSize: 'medium',
  mobileLauncherOffsetX: 16,
  mobileLauncherOffsetY: 16,
  mobileMessageMaxWidth: '85%',
  mobileShowMinimizeButton: false,
  tabletChatWindowWidth: 380,
  tabletChatWindowHeight: 550,
  tabletFontSize: 15,
  enableTouchOptimizations: true,
  touchTargetMinSize: 44,
  adjustForKeyboard: true,
  keyboardPaddingBottom: 0,

  // Advanced
  enableAnimations: true,
  animationDuration: 200,
  animationEasing: 'ease-out',
  enableHighContrast: false,
  respectReducedMotion: true,
  enableKeyboardNavigation: true,
  focusRingColor: '#6366f1',
  focusRingWidth: 2,
  theme: 'light',
  darkModePrimaryColor: '#6366f1',
  darkModeSecondaryColor: '#818cf8',
  darkModeBackgroundColor: '#1e293b',
  darkModeSecondaryBackgroundColor: '#374151',
  darkModeTextColor: '#f1f5f9',
  darkModeTextSecondaryColor: '#94a3b8',
  darkModeBorderColor: '#475569',
  lazyLoadMessages: true,
  preloadWidget: false,
  sanitizeHtml: true,
  allowedHtmlTags: ['b', 'i', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
  enableAnalytics: true,
  trackMessageEvents: true,
  trackUserInteractions: true,
};

/**
 * Get widget settings for a site
 * Uses caching for improved performance
 */
export async function getWidgetSettings(siteId: string): Promise<WidgetSettings | null> {
  try {
    // Try cache first
    return await cacheService.getOrSet(
      CacheNamespace.WIDGET_SETTINGS,
      siteId,
      async () => {
        const settings = await prisma.widgetSettings.findUnique({
          where: { siteId },
        });
        return settings;
      },
      CacheTTL.LONG // 1 hour cache
    );
  } catch (error) {
    logger.error('Failed to get widget settings:', error);
    throw error;
  }
}

/**
 * Get widget settings or create defaults if they don't exist
 * Uses caching for improved performance
 */
export async function getOrCreateWidgetSettings(siteId: string): Promise<WidgetSettings> {
  try {
    // Try cache first
    const cached = await cacheService.get<WidgetSettings>(CacheNamespace.WIDGET_SETTINGS, siteId);
    if (cached) {
      return cached;
    }

    // Not in cache, check database
    let settings = await prisma.widgetSettings.findUnique({
      where: { siteId },
    });

    if (!settings) {
      settings = await prisma.widgetSettings.create({
        data: {
          ...defaultWidgetSettings,
          site: {
            connect: { id: siteId },
          },
        },
      });
      logger.info(`Created default widget settings for site ${siteId}`);
    }

    // Cache the result
    await cacheService.set(CacheNamespace.WIDGET_SETTINGS, siteId, settings, CacheTTL.LONG);

    return settings;
  } catch (error) {
    logger.error('Failed to get or create widget settings:', error);
    throw error;
  }
}

/**
 * Create widget settings for a site
 */
export async function createWidgetSettings(
  siteId: string,
  data?: Partial<Omit<Prisma.WidgetSettingsCreateInput, 'site'>>
): Promise<WidgetSettings> {
  try {
    const settings = await prisma.widgetSettings.create({
      data: {
        ...defaultWidgetSettings,
        ...data,
        site: {
          connect: { id: siteId },
        },
      },
    });

    logger.info(`Created widget settings for site ${siteId}`);
    return settings;
  } catch (error) {
    logger.error('Failed to create widget settings:', error);
    throw error;
  }
}

/**
 * Update widget settings for a site
 */
export async function updateWidgetSettings(
  siteId: string,
  data: Partial<Omit<WidgetSettings, 'id' | 'siteId' | 'createdAt' | 'updatedAt'>>
): Promise<WidgetSettings> {
  try {
    // Check if settings exist, create if not
    const existing = await prisma.widgetSettings.findUnique({
      where: { siteId },
    });

    if (!existing) {
      return createWidgetSettings(siteId, data);
    }

    const settings = await prisma.widgetSettings.update({
      where: { siteId },
      data,
    });

    // Invalidate cache
    await cacheService.delete(CacheNamespace.WIDGET_SETTINGS, siteId);

    logger.info(`Updated widget settings for site ${siteId}`);
    return settings;
  } catch (error) {
    logger.error('Failed to update widget settings:', error);
    throw error;
  }
}

/**
 * Reset widget settings to defaults
 */
export async function resetWidgetSettings(siteId: string): Promise<WidgetSettings> {
  try {
    const settings = await prisma.widgetSettings.upsert({
      where: { siteId },
      update: defaultWidgetSettings,
      create: {
        ...defaultWidgetSettings,
        site: {
          connect: { id: siteId },
        },
      },
    });

    // Invalidate cache
    await cacheService.delete(CacheNamespace.WIDGET_SETTINGS, siteId);

    logger.info(`Reset widget settings to defaults for site ${siteId}`);
    return settings;
  } catch (error) {
    logger.error('Failed to reset widget settings:', error);
    throw error;
  }
}

/**
 * Delete widget settings for a site
 */
export async function deleteWidgetSettings(siteId: string): Promise<void> {
  try {
    await prisma.widgetSettings.delete({
      where: { siteId },
    });

    logger.info(`Deleted widget settings for site ${siteId}`);
  } catch (error) {
    logger.error('Failed to delete widget settings:', error);
    throw error;
  }
}

/**
 * Get public widget settings (subset for embedded widget)
 * This excludes sensitive/internal settings
 */
export async function getPublicWidgetSettings(siteId: string): Promise<Partial<WidgetSettings> | null> {
  try {
    const settings = await getOrCreateWidgetSettings(siteId);

    // Return all settings except internal ones
    const { id, createdAt, updatedAt, ...publicSettings } = settings;

    return publicSettings;
  } catch (error) {
    logger.error('Failed to get public widget settings:', error);
    throw error;
  }
}

/**
 * Validate widget settings data
 */
export function validateWidgetSettings(
  data: Partial<WidgetSettings>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate colors (hex format)
  const colorFields = [
    'primaryColor',
    'secondaryColor',
    'backgroundColor',
    'textColor',
    'textSecondaryColor',
    'borderColor',
    'launcherIconColor',
    'launcherBadgeColor',
    'launcherBadgeTextColor',
    'headerTextColor',
    'userBubbleTextColor',
    'assistantBubbleBackgroundColor',
    'assistantBubbleTextColor',
    'inputBackgroundColor',
    'inputTextColor',
    'inputBorderColor',
    'sendButtonIconColor',
    'focusRingColor',
    'darkModePrimaryColor',
    'darkModeSecondaryColor',
    'darkModeBackgroundColor',
    'darkModeSecondaryBackgroundColor',
    'darkModeTextColor',
    'darkModeTextSecondaryColor',
    'darkModeBorderColor',
  ];

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  for (const field of colorFields) {
    const value = data[field as keyof typeof data] as string | undefined;
    if (value && !hexColorRegex.test(value)) {
      errors.push(`${field} must be a valid hex color (e.g., #ffffff)`);
    }
  }

  // Validate numeric ranges
  if (data.fontSize && (data.fontSize < 10 || data.fontSize > 24)) {
    errors.push('fontSize must be between 10 and 24');
  }

  if (data.borderRadius && (data.borderRadius < 0 || data.borderRadius > 50)) {
    errors.push('borderRadius must be between 0 and 50');
  }

  if (data.chatWindowWidth && (data.chatWindowWidth < 300 || data.chatWindowWidth > 800)) {
    errors.push('chatWindowWidth must be between 300 and 800');
  }

  if (data.chatWindowHeight && (data.chatWindowHeight < 400 || data.chatWindowHeight > 900)) {
    errors.push('chatWindowHeight must be between 400 and 900');
  }

  if (data.soundVolume && (data.soundVolume < 0 || data.soundVolume > 1)) {
    errors.push('soundVolume must be between 0 and 1');
  }

  if (data.maxFileSizeMB && (data.maxFileSizeMB < 1 || data.maxFileSizeMB > 50)) {
    errors.push('maxFileSizeMB must be between 1 and 50');
  }

  // Validate enum-like fields
  const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  if (data.launcherPosition && !validPositions.includes(data.launcherPosition)) {
    errors.push(`launcherPosition must be one of: ${validPositions.join(', ')}`);
  }

  const validSizes = ['small', 'medium', 'large'];
  if (data.launcherSize && !validSizes.includes(data.launcherSize)) {
    errors.push(`launcherSize must be one of: ${validSizes.join(', ')}`);
  }

  const validShapes = ['circle', 'rounded-square', 'square'];
  if (data.launcherShape && !validShapes.includes(data.launcherShape)) {
    errors.push(`launcherShape must be one of: ${validShapes.join(', ')}`);
  }

  const validThemes = ['light', 'dark', 'auto'];
  if (data.theme && !validThemes.includes(data.theme)) {
    errors.push(`theme must be one of: ${validThemes.join(', ')}`);
  }

  const validAnimations = ['none', 'pulse', 'bounce', 'shake', 'glow'];
  if (data.launcherAnimation && !validAnimations.includes(data.launcherAnimation)) {
    errors.push(`launcherAnimation must be one of: ${validAnimations.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
